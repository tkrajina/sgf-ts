import { SGFGoban } from "./goban";
import { parseSGF } from "./parser";
import { SGFColor, SGFNode, Tag, coordinateToRowColumn, rowColumnToCoordinate } from "./sgf";

const BACKGROUND_COLOR = "#ebb063";
const AUTOPLAY_INTERVAL = 400;

const coordinatesLetters = "abcdefghjklmnopqrst";

type StoneElement = HTMLElement & { row: number, col: number };

type SGFNodeWithMetadata = SGFNode & {
	pathToSolution?: boolean;
	solution?: boolean;
	failure?: boolean;
	offPath?: boolean;
};

const correctWords = ["correct", "točno", "+", "right"];

function applyStyle(el: HTMLElement, style?: Partial<CSSStyleDeclaration>) {
	if (style) {
		for (const key of Object.keys(style)) {
			el.style[key] = style[key];
		}
	}
}

function getElement(prefix: string, id: string) {
	id = prefix + "_" + id;
	return document.getElementById(id);
}

function getOrCreateElement(prefix: string, name: string, id: string, style?: Partial<CSSStyleDeclaration>, innerHTML?: string) {
	id = prefix + "_" + id;
	let el = document.getElementById(id);
	let created = false;
	if (!el) {
		created = true;
		el = document.createElement(name);
	}
	if (id) {
		el.id = id;
	}
	applyStyle(el, style);
	if (innerHTML) {
		el.innerHTML = innerHTML;
	}
	return { element: el, created: created };
}

function createElement(prefix: string, name: string, id: string, style?: Partial<CSSStyleDeclaration>) {
	const el = getOrCreateElement(prefix, name, id);
	applyStyle(el.element, style);
	return el;
}

enum GobanViewerMode {
	PLAY = "PLAY",
	PROBLEM = "PROBLEM",
	GUESS_MOVE = "GUESS_MOVE",
}

abstract class AbstractGobanViewer {

	protected elementId: string;
	protected positionViewer: GobanPositionViewer;

	protected rootNode: SGFNode;
	protected currentNode: SGFNode;
	protected goban: SGFGoban;

	constructor(elementId: string, node?: SGFNode) {
		this.elementId = elementId;
		const rootElement = document.getElementById(this.elementId);
		if (!rootElement) {
			alert("no goban element found by  " + elementId);
			return;
		}
		if (!node) {
			const sgf = rootElement.innerText.trim();
			try {
				node = parseSGF(sgf);
			} catch (e) {
				alert("no sgf found");
				return;
			}
		}
		this.rootNode = node;
		this.currentNode = node;
	}

	draw(opts?: GobanViewerOpts) {
		opts.onClick = (row: number, col: number, color: SGFColor) => {
			this.onClick(row, col, color);
		}
		this.positionViewer = new GobanPositionViewer(this.elementId, this.rootNode.findPath(this.currentNode), opts);
		this.goban = this.positionViewer.goban;
		this.updateComment();
		this.updateNextToPlay();
	}

	updateComment() {
		const c = getElement(this.elementId, "comment");
		if (c) {
			let {comment} = this.getCommentAndDirectives(this.currentNode);
			c.innerHTML = comment?.split("\n").filter(line => line?.[0] !== "!").join("<br/>") || "";
		}
	}

	reset() {
		this.goTo(this.rootNode);
	}

	goTo(node?: SGFNode) {
		if (!node) {
			return;
		}
		this.positionViewer.setBgLabel("");
		this.currentNode = node;
		const path = this.rootNode.findPath(node);
		this.goban = new SGFGoban();
		this.goban.applyNodes(...path);
		this.positionViewer.draw(this.goban);
		this.updateComment();
		this.updateNextToPlay();
	}

	updateNextToPlay() {
		let turnEl = getElement(this.elementId, "turn");
		if (turnEl) {
			turnEl.style.backgroundColor = BACKGROUND_COLOR;
			if (this.goban.nextToPlay === SGFColor.BLACK) {
				turnEl.style.color = "black";
			} else if (this.goban.nextToPlay === SGFColor.WHITE) {
				turnEl.style.color = "white";
			}
		}
	}

	getPropertyOrCommandDirective(name: string, node: SGFNode) {
		let {directives} = this.getCommentAndDirectives(node);
		if (directives[name.toUpperCase()]) {
			return directives[name.toUpperCase()];
		}
		return node.getProperty(name.toUpperCase());
	}

	getCommentAndDirectives(node: SGFNode) {
		let commentCleaned: string[] = [];
		let directives: {[name: string]: string} = {};
		const comments = node.getProperties(Tag.Comment);
		if (comments?.length > 0) {
			for (const comment of comments) {
				console.log("comment:" + comment);
				for (let line of comment.split("\n")) {
					line = line.trim();
					console.log("line:" + line)
					if (line?.[0] === "!") {
						line = line.substring(1);
						const parts = line.split(/\s+/);
						const key = parts.shift().toUpperCase();
						const val = parts.join(" ").trim();
						directives[key] = val || "true";
					} else {
						commentCleaned.push(line)
					}
				}
			}
		}
		return {comment: commentCleaned.join("\n"), directives: directives};
	}

	abstract onClick(row: number, col: number, color: SGFColor);
}

type ProblemGobanViewerOpts = GobanViewerOpts & {onCorrect: (node: SGFNode) => void};

class ProblemGobanViewer extends AbstractGobanViewer {

	initialSkip = 0;
	showSolution = false;
	autoPlayColor: SGFColor | undefined = undefined;
	autoPlayTimeout: any;
	animationSpeed = 1;
	solutionPathLengths: number[] = [];

	opts: ProblemGobanViewerOpts;

	constructor(elementId: string, node?: SGFNode, opts?: ProblemGobanViewerOpts) {
		super(elementId, node);
		this.opts = opts || {} as ProblemGobanViewerOpts;
		this.parseDirectives();

		if (this.initialSkip > 0) {
			const goban = new SGFGoban();
			let tmpNode = this.rootNode;
			for (let i = 0; i < this.initialSkip; i++) {
				goban.applyNodes(tmpNode);
				tmpNode = tmpNode.children?.[0];
			}
			this.rootNode = this.rootNode.flattenToNode(tmpNode);
			this.rootNode.children = tmpNode.children;
			this.currentNode = this.rootNode;
		}

		this.fillSolutionsMetadata(this.rootNode);
		let [color] = this.rootNode.playerAndCoordinates()
		this.autoPlayColor = color;

		super.draw({mode: GobanViewerMode.PROBLEM, ...this.opts});
	};

	resetAnimation() {
		clearInterval(this.autoPlayTimeout);
		clearTimeout(this.autoPlayTimeout);
		this.autoPlayTimeout = null;
	}

	parseDirectives() {
		for (const node of this.rootNode.mainLine()) {
			const crop = this.getPropertyOrCommandDirective("crop", node) as string;
			if (crop) {
				if ((crop as CropType) == "auto" || (crop as CropType) == "square") {
					this.opts.crop = crop as CropType;
				} else {
					const parts = crop.trim().split(/[\s,]+/) || ["0","0","0","0"];
					const cropTop = parseFloat(parts[0]) || 0;
					const cropRight = parseFloat(parts[1]) || 0;
					const cropBottom = parseFloat(parts[2]) || 0;
					const cropLeft = parseFloat(parts[3]) || 0;
					this.opts.crop = [cropTop, cropRight, cropBottom, cropLeft];
				}
			}
			const speed = this.getPropertyOrCommandDirective("speed", node);
			if (speed) {
				const s = parseFloat(speed);
				this.opts.animationSpeed = !s || isNaN(s) ? 1 : s;
				this.animationSpeed = this.opts.animationSpeed;
			}
			const start = this.getPropertyOrCommandDirective("start", node);
			const skip = this.getPropertyOrCommandDirective("skip", node);
			if (skip) {
				this.initialSkip = parseInt(skip) || 0;
				console.log(`skip ${skip} => ${this.initialSkip} moves`);
			}
			const anki = this.getPropertyOrCommandDirective("anki", node);
			if (anki) {
				const mainLine = this.rootNode.mainLine();
				const n = mainLine.length;
				let ankiFrom = parseInt(anki)
				if (!isNaN(ankiFrom)) {
					if (ankiFrom > 0) {
						ankiFrom = -ankiFrom;
					}
					this.initialSkip = n + ankiFrom - 1;
					console.log(`(anki) skip ${anki} => ${this.initialSkip} moves`);
				}
			}

			console.log(`crop=${crop}, speed=${speed}, start=${start}, skip=${skip}, anki=${anki}`);
		}
	}

	fillSolutionsMetadata(node: SGFNode) {
		let solutionFound = 0;
		this.solutionPathLengths = [];
		node.walk((node: SGFNode, path: SGFNode[]) => {
			if (!node.children?.length) {
				let isSolution = false;
				const com = node?.getComment();
				for (const word of correctWords) {
					if (com?.trim()?.toLowerCase()?.indexOf(word) == 0) {
						isSolution = true;
						for (const e of path) {
							(e as SGFNodeWithMetadata).pathToSolution = true;
							solutionFound ++;
						}
					}
				}
				if (isSolution) {
					(node as SGFNodeWithMetadata).solution = true;
					this.solutionPathLengths.push(path.length);
					solutionFound ++;
				} else {
					(node as SGFNodeWithMetadata).failure = true;
				}
			}
		})
		if (!solutionFound) {
			console.log("Solution is not specified in the SGF => assume main line is solution");
			const path = this.rootNode.mainLine();
			for (node of path) {
				(node as SGFNodeWithMetadata).pathToSolution = true;
			}
			(path[path.length - 1] as SGFNodeWithMetadata).solution = true;
			this.solutionPathLengths.push(path.length);
		}
	}

	reset() {
		this.positionViewer.setBgLabel("");
		super.reset();
	}

	toggleShowSolution() {
		this.showSolution = !this.showSolution;
		if (this.showSolution) {
			this.markSolutions();
		} else {
			this.goTo(this.currentNode);
		}
	}

	goTo(node?: SGFNode) {
		super.goTo(node);
		if ((node as SGFNodeWithMetadata)?.solution) {
			this.positionViewer.setBgLabel("✓", "green", {opacity: 0.6});
			this.opts?.onCorrect?.(this.currentNode);
		} else if ((node as SGFNodeWithMetadata)?.failure) {
			this.positionViewer.setBgLabel("✗", "red", {opacity: 0.6});
		} else if ((node as SGFNodeWithMetadata)?.offPath) {
			this.positionViewer.setBgLabel("?", "gray", {opacity: 0.25});
		}
		this.markSolutions();
	}

	markSolutions() {
		const node = this.currentNode;
		if (this.showSolution) {
			for (const subnode of node?.children || []) {
				let [color, coords] = subnode.playerAndCoordinates();
				let [row, col] = coordinateToRowColumn(coords);
				if ((subnode as SGFNodeWithMetadata)?.pathToSolution || (subnode as SGFNodeWithMetadata)?.solution) {
					this.positionViewer.drawLabel(row, col, "✓", { color: "green", fontScale: .9 });
				} else {
					this.positionViewer.drawLabel(row, col, "✗", { color: "red", fontScale: .9 });
				}
			}
		}
	}

	onClick(row: number, col: number, color: SGFColor) {
		if (this.autoPlayTimeout) {
			return;
		}
		const coord = rowColumnToCoordinate([row, col]);
		for (const i in this.currentNode?.children || []) {
			const child = this.currentNode.children[i];
			let [_, childCoord] = child.playerAndCoordinates();
			if (coord == childCoord) {
				if ((child as SGFNodeWithMetadata)?.pathToSolution) {
					console.log("yes");
				}
				this.goTo(child);
				if (!this.showSolution) {
					this.autoPlayTimeout = setTimeout(() => {
						this.autoPlayTimeout = null;
						if (!child.children?.length) {
							return;
						}
						const first = (child.children || []).find((sub => {
							if ((sub as SGFNodeWithMetadata).pathToSolution) {
								return true;
							}
						}))
						if (first) {
							this.goTo(first);
						}
						this.goTo(child.children[0]);
					}, 2 * 250);
				}
				return;
			}
		}
		const node = (new SGFNode()) as SGFNodeWithMetadata;
		node.offPath = true;
		node.setProperty(Tag.Comment, "Wrong (off path)");
		node.setMove(color, coord);
		try {
			this.goban.applyNodes(node); // TODO: Check for errors
			this.currentNode.appendNode(node);
			this.goTo(node);
		} catch (e) {
			console.error(e);
		}
	}

	next() {
		if (this.autoPlayTimeout) {
			return;
		}
		const node = this.currentNode.children?.[0];
		if (!node) {
			return;
		}
		this.goTo(node);
	}

	animate(nodes: SGFNode[], interval = AUTOPLAY_INTERVAL) {
		this.resetAnimation();
		if (this.autoPlayTimeout) {
			return;
		}
		let i = 0;
		this.autoPlayTimeout = setInterval(async () => {
			this.goTo(nodes[i]);
			i++;
			if (i >= nodes.length) {
				clearInterval(this.autoPlayTimeout);
				this.autoPlayTimeout = null;
			}
		}, interval / this.animationSpeed);
	}

	animateSolution(interval = AUTOPLAY_INTERVAL) {
		let firstSolution: SGFNode[];
		this.rootNode.walkUntil((node: SGFNode, path: SGFNode[]) => {
			if ((node as SGFNodeWithMetadata)?.solution) {
				firstSolution = path;
				return true;
			}
			return false;
		});
		if (firstSolution) {
			this.animate(firstSolution, interval);
		}
	}

	previous() {
		if (this.autoPlayTimeout) {
			return;
		}
		const path = this.rootNode.findPath(this.currentNode);
		if ((path?.length || 0) <= 1) {
			return;
		}
		path.pop();
		this.goTo(path[path.length - 1])
	}
}

type CropType = "auto" | "square" | [number, number, number, number];

interface GobanViewerOpts {
	mode?: GobanViewerMode,
	side?: number,
	unit?: string,
	crop: CropType,
	cropLeft: number
	onClick?: (row: number, col: number, coloe: SGFColor) => void;
	coordinates?: boolean;
	animationSpeed?: number;
}

class GobanPositionViewer {

	idPrefix: string;

	size = 19;

	/** Side of the goban the user wants */
	originalWidth: number;

	/** Side of the goban including the cropped parts */
	width = 80; // This can change when cropping and zooming

	bandWidth: number;
	unit = "vmin";
	goban: SGFGoban;

	rootElement: HTMLElement;
	gobanDiv: HTMLElement;
	bgLabelDiv: HTMLElement;
	tmpHoverStone: HTMLElement;

	cropTop = 0;
	cropRight = 0;
	cropBottom = 0;
	cropLeft = 0;

	/** Elements to be deleted before every position change */
	temporaryElements: HTMLElement[] = [];

	coordinates: boolean = false;

	private mouseOverRow: number;
	private mouseOverCol: number;

	private onClick?: (row: number, col: number, SGFColor) => void;

	constructor(private elementId: string, nodeOrNodes: SGFNode[] | SGFNode, opts?: GobanViewerOpts) {
		let node: SGFNode;
		let nodes: SGFNode[];
		if ((nodeOrNodes as SGFNode[]).pop) {
			nodes = nodeOrNodes as SGFNode[];
			node = nodes[0];
		} else {
			node = nodeOrNodes as SGFNode;
			nodes = [node];
		}

		this.idPrefix = elementId;
		this.width = opts?.side || 80;
		this.originalWidth = this.width;
		this.unit = opts?.unit || "vmin";
		this.rootElement = document.getElementById(this.elementId);
		if (opts?.crop) {
			if (opts.crop == "auto" || opts.crop == "square") {
				const bounds = node.bounds();
				// alert(JSON.stringify(bounds))
				bounds.increase(this.size, 2, 6);
				// alert(JSON.stringify(bounds))
				if (opts.crop == "square") {
					bounds.makeSquare(this.size);
				}
				// alert(JSON.stringify(bounds))
				let top = bounds.rowMin;
				let left = bounds.colMin;
				let right = this.size - bounds.colMax - 1;
				let bottom = this.size - bounds.rowMax - 1;
				// alert(`${top} ${right} ${bottom} ${left}`);
				this.cropTop = this.cropFactor(top);
				this.cropRight = this.cropFactor(right);
				this.cropBottom = this.cropFactor(bottom);
				this.cropLeft = this.cropFactor(left);
				// alert(this.cropTop + "," + this.cropRight + "," + this.cropBottom + "," + this.cropLeft);
			} else {
				this.cropTop = this.cropFactor(opts.crop[0] as number || 0);
				this.cropRight = this.cropFactor(opts.crop[1] as number || 0);
				this.cropBottom = this.cropFactor(opts.crop[2] as number || 0);
				this.cropLeft = this.cropFactor(opts.crop[3] as number || 0);
			}
		}
		this.onClick = opts?.onClick;
		this.coordinates = opts?.coordinates;
		if (!this.rootElement) {
			alert("no goban element found");
			return;
		}
		this.size = parseInt(node.findFirstProperty(Tag.Size)) || 19;
		this.drawGoban();
		const goban = new SGFGoban();
		goban.applyNodes(...nodes);
		this.draw(goban);
	}

	private cropFactor(cropFactor: number) {
		if (!cropFactor) {
			return 0;
		}
		if (cropFactor >= 1) {
			const res = cropFactor / this.size; // - 0.25 / this.size;
			console.log(`${cropFactor} -> ${res}`);
			return res;
		}
		const res = Math.round(this.size * cropFactor) / this.size; // - .25 / this.size;
		console.log(`${cropFactor} -> ${res}`);
		return res;
	}

	private gobanWidth() {
		return (1 - this.cropRight - this.cropLeft) * this.width;
	}

	private gobanHeight() {
		return (1 - this.cropTop - this.cropBottom) * this.width;
	}

	drawGoban() {
		this.width = Math.min(
			this.originalWidth / (1 - this.cropLeft - this.cropRight),
			this.originalWidth / (1 - this.cropTop - this.cropBottom)
		);
		this.bandWidth = this.width / this.size;

		const w = (this.coordinates ? 2 * this.bandWidth : 0) + this.gobanWidth();
		const h = (this.coordinates ? 2 * this.bandWidth : 0) + this.gobanHeight();
		const withCoordinatesDiv = getOrCreateElement(this.idPrefix, "div", "goban-coordinates", {
			overflow: "hidden",
			backgroundColor: BACKGROUND_COLOR,
			position: "relative",
			width: `${w}${this.unit}`,
			height: `${h}${this.unit}`,
			display: "flex",
			alignItems: "center",
			justifyItems: "center",
			textAlign: "center",
			alignContent: "center",
			justifyContent: "center",
			fontSize: `${Math.min(w, h) * .75}${this.unit}`
		}).element;
		this.bgLabelDiv = getOrCreateElement(this.elementId, "div", "bgtext", {
			alignSelf: "center",
			justifySelf: "center"
		}).element;
		withCoordinatesDiv.appendChild(this.bgLabelDiv);

		// Used to crop the overflow:
		const cropContainerDiv = getOrCreateElement(this.idPrefix, "div", "goban-container", {
			position: "absolute",
			overflow: "hidden",
			width: `${this.gobanWidth()}${this.unit}`,
			height: `${this.gobanHeight()}${this.unit}`,
			top: this.coordinates ? `${this.bandWidth}${this.unit}` : "0px",
			left: this.coordinates ? `${this.bandWidth}${this.unit}` : "0px",
			margin: `1px`,
		}).element;

		this.gobanDiv = getOrCreateElement(this.idPrefix, "div", "goban_div", {
			width: `${this.width}${this.unit}`,
			height: `${this.width}${this.unit}`,
			position: "relative",
			top: `${(- this.cropTop) * this.width}${this.unit}`,
			left: `${(- this.cropLeft) * this.width}${this.unit}`,
		}).element;
		// this.gobanDiv.onmouseleave = (e: MouseEvent) => {
		// 	e.preventDefault();
		// 	console.log("out of the goban");
		// };
		this.rootElement.innerHTML = "";
		cropContainerDiv.appendChild(this.gobanDiv);
		withCoordinatesDiv.appendChild(cropContainerDiv);
		this.rootElement.appendChild(withCoordinatesDiv);
		// const emptyBorder = .5 * this.side / this.size;
		for (let index = 0; index < this.size; index++) {
			this.gobanDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `vertical-${index}`, {
				position: "absolute",
				height: `${this.width - this.bandWidth}${this.unit}`,
				width: "0.5px",
				color: "black",
				top: `${this.bandWidth / 2}${this.unit}`,
				left: `${this.width * index / this.size + this.bandWidth / 2.}${this.unit}`,
				backgroundColor: "black"
			}).element)
			this.gobanDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `horizontal-${index}`, {
				position: "absolute",
				width: `${this.width - this.bandWidth}${this.unit}`,
				height: "0.5px",
				color: "black",
				left: `${this.bandWidth / 2}${this.unit}`,
				top: `${this.width * index / this.size + this.bandWidth / 2.}${this.unit}`,
				backgroundColor: "black"
			}).element)
		}
		this.drawHoshi();
		if (this.coordinates) {
			this.drawCoordinates(withCoordinatesDiv);
		}
	}

	setBgLabel(str: string, color: string = "black", opts?: {opacity?: number}) {
		applyStyle(this.bgLabelDiv, { color: color, opacity: opts?.opacity === undefined ? "1" : "" + opts.opacity });
		this.bgLabelDiv.innerHTML = str;
	}

	drawCoordinates(withCoordinatesDiv: HTMLElement) {
		if (!this.coordinates) {
			return;
		}
		for (let i = 0; i < this.size; i++) {
			const top = (i + 1) * this.bandWidth - this.cropTop * this.width;
			let baseStyle: Partial<CSSStyleDeclaration> = {
				position: "absolute",
				display: "flex",
				alignItems: "center",
				justifyItems: "center",
				textAlign: "center",
				alignContent: "center",
				justifyContent: "center",
				flexGrow: "1",
				width: `${this.bandWidth}${this.unit}`,
				height: `${this.bandWidth}${this.unit}`,
				fontSize: `${this.bandWidth / 3}${this.unit}`,
				color: "black"
			}
			console.log(`label=${coordinatesLetters.charAt(i).toUpperCase() || `${i}`} top=${top}, height=${this.gobanHeight()} band=${this.bandWidth}`)
			if (0 < top && top <= this.gobanHeight()) {
				withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-left`, {
					...baseStyle,
					top: `${top}${this.unit}`,
					left: "0px",
				}, `${this.size - i}`).element);
				withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-right`, {
					...baseStyle,
					top: `${top}${this.unit}`,
					right: "0px",
				}, `${this.size - i}`).element);
			}
			const left = (i + 1) * this.bandWidth - this.cropLeft * this.width;
			if (0 < left && left <= this.gobanWidth()) {
				withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-top`, {
					...baseStyle,
					top: "0px",
					left: `${left}${this.unit}`,
				}, coordinatesLetters.charAt(i).toUpperCase() || `${i}`).element);
				withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-bottom`, {
					...baseStyle,
					bottom: "0px",
					left: `${left}${this.unit}`,
				}, coordinatesLetters.charAt(i).toUpperCase() || `${i}`).element);
			}
		}
	}

	drawHoshi() {
		let hoshiPositions: [number, number][] = [];
		switch (this.size) {
			case 19:
				hoshiPositions = [
					[3, 3], [3, 9], [3, 15],
					[9, 3], [9, 9], [9, 15],
					[15, 3], [15, 9], [15, 15],
				];
				break;
			case 13:
				hoshiPositions = [
					[3, 3], [3, 9],
					[6, 6],
					[9, 3], [9, 9],
				];
				break;
			case 9:
				hoshiPositions = [
					[2, 2], [2, 6],
					[6, 2], [6, 6],
				];
				break;
		}
		for (const pos of hoshiPositions) {
			this.drawIntersectionDot("hoshi", pos[0], pos[1], { opacity: 1, radious: this.bandWidth / 5, color: "black" })
		}
	}

	drawIntersectionDot(idPrefix: string, row: number, col: number, params: { opacity?: any, color: string, radious: number }) {
		const div = getOrCreateElement(this.idPrefix, "div", `${idPrefix}-intersection-${row}-${col}`, {
			justifyContent: "center",
			alignContent: "center",
			display: "flex",
			flexDirection: "row",
			position: "absolute",
			width: `${this.bandWidth}${this.unit}`,
			height: `${this.bandWidth}${this.unit}`,
			top: `${row * this.bandWidth}${this.unit}`,
			left: `${col * this.bandWidth}${this.unit}`
		}).element
		div.appendChild(getOrCreateElement(this.idPrefix, "div", `innext-hoshi-${row}-${col}`, {
			opacity: params.opacity ? params.opacity : 1,
			backgroundColor: params.color ? params.color : "black",
			borderRadius: `${params.radious}${this.unit}`,
			alignSelf: "center",
			justifySelf: "center",
			justifyContent: "center",
			width: `${params.radious}${this.unit}`,
			height: `${params.radious}${this.unit}`
		}).element)
		this.gobanDiv.appendChild(div);
		this.gobanDiv.onmouseleave = this.onMouseLeaveGoban.bind(this);
		this.gobanDiv.onmouseup = e => {
			if (this.mouseOverRow !== undefined && this.mouseOverCol !== undefined) {
				this?.onClick?.(this.mouseOverRow, this.mouseOverCol, this.goban.nextToPlay);
				this.showCoordinate();
			}
		};
		return div;
	}

	coordinateTimeout: any;

	showCoordinate() {
		clearTimeout(this.coordinateTimeout);
		const el = getElement(this.elementId, "coordinate_clicked");
		if (el) {
			const coord = rowColumnToCoordinate([this.mouseOverRow, this.mouseOverCol]);
			el.innerHTML = `${coordinatesLetters.charAt(this.mouseOverCol).toUpperCase()}${this.size - this.mouseOverRow} / ${coord}`;
		}
		this.coordinateTimeout = setTimeout(() => {
			el.innerHTML = "";
		}, 1000)
	}

	draw(goban: SGFGoban) {
		for (const el of this.temporaryElements) {
			el.remove();
		}
		this.goban = goban;
		for (let row = 0; row < this.size; row++) {
			console.log(JSON.stringify(this.goban.goban[row]));
			for (let col = 0; col < this.size; col++) {
				this.drawStone(row, col);
			}
		}
		if (this.goban.latestMove) {
			let [row, col] = coordinateToRowColumn(this.goban.latestMove);
			/*
				<IntersectionDot radious={bandWidth / 3}
					color={props.goban.stoneAt(props.goban.latestMove) == SGFColor.BLACK ? "white" : "black"}
					bandWidth={bandWidth} unit={unit} />}
			*/
			this.temporaryElements.push(this.drawIntersectionDot("lastpt", row, col, {
				color: this.goban.stoneAt(this.goban.latestMove) == SGFColor.BLACK ? "white" : "black",
				radious: this.bandWidth / 3,
			}))
		}
		for (const coord in this.goban.labels) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, this.goban.labels[coord], { color: color });
		}
		for (const coord in this.goban.triangles) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, "△", { color: color });
		}
		for (const coord in this.goban.squares) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, "□", { color: color });
		}
		for (const coord in this.goban.crosses) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, "×", { color: color });
		}
		for (const coord in this.goban.circles) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, "○", { color: color });
		}
	}

	private getStoneElement(row: number, col: number) {
		return document.getElementById(`${this.idPrefix}_stone-${row}-${col}`);
	}

	private drawStone(row: number, col: number) {
		const color = this.goban.goban?.[row]?.[col];
		let cssColor = "";
		switch (color) {
			case SGFColor.BLACK:
				cssColor = "black";
				break;
			case SGFColor.WHITE:
				cssColor = "white";
				break;
			case SGFColor.NONE, SGFColor.INVALID:
				cssColor = "";
				break;
		}
		let stoneElement = getOrCreateElement(this.idPrefix, "div", `stone-${row}-${col}`, {
			display: "flex",
			justifyContent: "center",
			alignContent: "center",
			// opacity: props?.opacity ? props.opacity : undefined,
			position: "absolute",
			width: `${this.bandWidth}${this.unit}`,
			height: `${this.bandWidth}${this.unit}`,
			top: `${row * this.bandWidth}${this.unit}`,
			left: `${col * this.bandWidth}${this.unit}`,
		})
		if (this.getStoneElement(row, col) == stoneElement.element) {
			console.error("stone element id invalid!")
		}
		if (stoneElement.created) {
			this.gobanDiv.appendChild(stoneElement.element);
			(stoneElement.element as StoneElement).row = row;
			(stoneElement.element as StoneElement).col = col;
			stoneElement.element.onmouseenter = e => {
				const se = e.currentTarget as StoneElement;
				if (se?.row !== undefined && se?.col !== undefined) {
					this.onMouseEnter(row, col)
				}
			};
		}
		if (cssColor) {
			applyStyle(stoneElement.element, {
				borderRadius: `${this.bandWidth / 1}${this.unit}`,
				backgroundColor: cssColor,
			})
		} else {
			applyStyle(stoneElement.element, {
				backgroundColor: null,
			});
		}
	}

	private onMouseEnter(row: number, col: number) {
		if (row != this.mouseOverRow || col != this.mouseOverCol) {
			console.log(`on ${row},${col}`);
			this.mouseOverRow = row;
			this.mouseOverCol = col;

			let nextColor: string;
			if (this.goban.nextToPlay == SGFColor.WHITE) {
				nextColor = "white";
			} else if (this.goban.nextToPlay == SGFColor.BLACK) {
				nextColor = "black";
			}
			const el = getOrCreateElement(this.idPrefix, "div", "next-stone", {
				display: "flex",
				justifyContent: "center",
				alignContent: "center",
				position: "absolute",
				width: `${this.bandWidth}${this.unit}`,
				height: `${this.bandWidth}${this.unit}`,
				top: `${row * this.bandWidth}${this.unit}`,
				left: `${col * this.bandWidth}${this.unit}`,
				visibility: "visible",
				borderRadius: `${this.bandWidth / 1}${this.unit}`,
				backgroundColor: nextColor,
				opacity: "0.4",
			});
			if (el.created) {
				this.gobanDiv.appendChild(el.element);
				this.tmpHoverStone = el.element;
			}
		}
	}

	private onMouseLeaveGoban() {
		console.log(`out of goban`);
		this.mouseOverCol = undefined;
		this.mouseOverRow = undefined;
		applyStyle(this.tmpHoverStone, {
			visibility: "hidden",
		})
	}

	drawLabel(row: number, column: number, label: string, opts: { color: string, fontScale?: number }) {
		this.drawStone(row, column);
		console.log(`Label ${label} on ${row},${column}`);
		const stoneDiv = this.getStoneElement(row, column);
		const stone = this.goban.stoneAt(rowColumnToCoordinate([row, column]));
		const div = getOrCreateElement(this.idPrefix, "div", `label-${row}-${column}`, {
			color: opts.color,
			backgroundColor: stone === SGFColor.NONE ? BACKGROUND_COLOR : null,
			display: "flex",
			alignSelf: "center",
			justifySelf: "center",
			textAlign: "center",
			flexGrow: "1",
			justifyContent: "center",
			fontSize: `${this.bandWidth * (opts?.fontScale || 0.8)}${this.unit}`,
			fontWeight: "bold"
		}).element
		div.innerHTML = label;
		stoneDiv.appendChild(div);
		this.temporaryElements.push(div);
	}
}