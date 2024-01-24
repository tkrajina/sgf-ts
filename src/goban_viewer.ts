import { SGFGoban } from "./goban";
import { parseSGF } from "./parser";
import { SGFColor, SGFNode, Tag, coordinateToRowColumn, rowColumnToCoordinate } from "./sgf";

const coordinatesLetters = "abcdefghjklmnopqrst";

type StoneElement = HTMLElement & { row: number, col: number };

type SGFNodeWithMetadata = SGFNode & {
	pathToSolution?: boolean;
	offPath?: boolean;
};

function markPathsToSolution(node: SGFNode) {
	node.walk((path: SGFNode[]) => {
		if (!path?.length) {
			return;
		}
		const last = path[path.length - 1];
		if (last?.children?.length) {
			return;
		}
		const com = last?.getProperty(Tag.Comment)
		if (com?.trim()?.toLowerCase().indexOf("correct") == 0) {
			for (const e of path) {
				(e as SGFNodeWithMetadata).pathToSolution = true;
			}
		}
	})
}

function applyStyle(el: HTMLElement, style?: Partial<CSSStyleDeclaration>) {
	if (style) {
		for (const key of Object.keys(style)) {
			el.style[key] = style[key];
		}
	}
}

function getOrCreateElement(prefix: string, name: string, id: string, style?: Partial<CSSStyleDeclaration>, innerHTML?: string) {
	id = prefix + "_" + id;
	let el = document.getElementById(id);
	let created = false;
	if (!el) {
		created = true;
		el =document.createElement(name);
	}
	if (id) {
		el.id = id;
	}
	applyStyle(el, style);
	if (innerHTML) {
		el.innerHTML = innerHTML;
	}
	return {element: el, created: created};
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
	autoPlayColor: SGFColor | undefined = undefined;

	constructor(elementId: string, node?: SGFNode, opts?: GobanViewerOpts) {
		this.elementId = elementId;
		const rootElement = document.getElementById(this.elementId);
		if (!rootElement) {
			alert("no goban element found");
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
		if (opts?.mode == GobanViewerMode.PROBLEM) { // TODO
			markPathsToSolution(this.rootNode);
		}
		this.currentNode = node;
		opts.onClick = (row: number, col: number, color: SGFColor) => {
			this.onClick(row, col, color);
		}
		this.positionViewer = new GobanPositionViewer(elementId, node, opts);
		this.goban = new SGFGoban();
		this.updateComment();
	}

	updateComment() {
		const c = getOrCreateElement(this.elementId, "div", "comment", {});
		if (c.created) {
			console.warn("Comment element not found")
		}
		c.element.innerHTML = this.currentNode?.getComment() || "";
	}

	reset() {
		this.goTo(this.rootNode);
	}

	goTo(node?: SGFNode) {
		if (!node) {
			return;
		}
		this.currentNode = node;
		const path = this.rootNode.findPath(node);
		this.goban = new SGFGoban();
		this.goban.applyNodes(...path);
		this.positionViewer.draw(this.goban);
		this.updateComment();
	}

	abstract onClick(row: number, col: number, color: SGFColor);
}

class ProblemGobanViewer extends AbstractGobanViewer {

	constructor(elementId: string, node?: SGFNode, opts?: GobanViewerOpts) {
		super(elementId, node, opts);
	}

	autoPlayTimeout: any;

	onClick(row: number, col: number, color: SGFColor) {
		if (this.autoPlayTimeout) {
			return;
		}
		const coord = rowColumnToCoordinate([row, col]);
		for (const i in this.currentNode?.children||[]) {
			const child = this.currentNode.children[i];
			let [_, childCoord] = child.playerAndCoordinates();
			if (coord == childCoord) {
				if ((child as SGFNodeWithMetadata)?.pathToSolution) {
					console.log("yes");
				}
				this.goTo(child);
				this.autoPlayTimeout = setTimeout(() => {
					this.autoPlayTimeout = null;
					if (!child.children?.length) {
						if ((child as SGFNodeWithMetadata)?.pathToSolution) {
							alert("Correct");
						} else {
							alert("Incorrect");
						}
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
		// TODO: Autoclick colors
		const node = this.currentNode.children?.[0];
		if (!node) {
			return;
		}
		this.goTo(node);
	}

	previous() {
		if (this.autoPlayTimeout) {
			return;
		}
		const path = this.rootNode.findPath(this.currentNode);
		if ((path?.length || 0) < 2) {
			return;
		}
		path.pop();
		this.currentNode = path[path.length - 1];
		this.goban = new SGFGoban();
		this.goban.applyNodes(...path);
		this.positionViewer.draw(this.goban);
	}

}

interface GobanViewerOpts {
	mode?: GobanViewerMode,
	side?: number,
	unit?: string,
	cropTop: number,
	cropRight: number,
	cropBottom: number,
	cropLeft: number
	onClick?: (row: number, col: number, coloe: SGFColor) => void;
	coordinates?: boolean;
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
	tmpHoverStone: HTMLElement;

	cropTop = .25;
	cropRight = .25;
	cropBottom = 0;
	cropLeft = 0;

	/** Elements to be deleted before every position change */
	temporaryElements: HTMLElement[] = [];

	coordinates: boolean = false;

	private mouseOverRow: number;
	private mouseOverCol: number;

	private onClick?: (row: number, col: number, SGFColor) => void;

	constructor(private elementId: string, node: SGFNode, opts?: GobanViewerOpts) {
		this.idPrefix = elementId;
		this.width = opts?.side || 50;
		this.originalWidth = this.width;
		this.unit = opts?.unit || "vmin";
		this.rootElement = document.getElementById(this.elementId);
		this.cropTop = this.cropFactor(opts.cropTop);
		this.cropRight = this.cropFactor(opts.cropRight);
		this.cropBottom = this.cropFactor(opts.cropBottom);
		this.cropLeft = this.cropFactor(opts.cropLeft);
		this.onClick = opts?.onClick;
		this.coordinates = opts?.coordinates;
		if (!this.rootElement) {
			alert("no goban element found");
			return;
		}
		this.size = parseInt(node.findFirstProperty(Tag.Size)) || 19;
		this.drawGoban();
		const goban = new SGFGoban();
		goban.applyNodes(node);
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

	private drawGoban() {

		this.width = Math.min(
			this.originalWidth / (1 - this.cropLeft - this.cropRight),
			this.originalWidth / (1 - this.cropTop - this.cropBottom)
		);
		this.bandWidth = this.width / this.size;

		const withCoordinatesDiv = getOrCreateElement(this.idPrefix, "div", "goban-coordinates", {
			overflow: "hidden",
			backgroundColor: "#ebb063",
			position: "relative",
			width: `${(this.coordinates ? 2 * this.bandWidth : 0) + this.gobanWidth()}${this.unit}`,
			height: `${(this.coordinates ? 2 * this.bandWidth : 0) + this.gobanHeight()}${this.unit}`,
		}).element;

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
			backgroundColor: "#ebb063",
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
				// <div style={{}} />
		}
		this.drawHoshi();
		if (this.coordinates) {
			this.drawCoordinates(withCoordinatesDiv);
		}
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
				}, coordinatesLetters.charAt(i).toUpperCase() || `${i}`).element);
				withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-right`, {
					...baseStyle,
					top: `${top}${this.unit}`,
					right: "0px",
				}, coordinatesLetters.charAt(i).toUpperCase() || `${i}`).element);
			}
			const left = (i + 1) * this.bandWidth - this.cropLeft * this.width;
			if (0 < left && left <= this.gobanWidth()) {
				withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-top`, {
					...baseStyle,
					top: "0px",
					left: `${left}${this.unit}`,
				}, `${i + 1}`).element);
				withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-bottom`, {
					...baseStyle,
					bottom: "0px",
					left: `${left}${this.unit}`,
				}, `${i + 1}`).element);
			}
		}
	}

	drawHoshi() {
		let hoshiPositions: [number, number][]  = [];
		switch (this.size) {
			case 19:
				hoshiPositions  = [
					[3, 3], [3, 9], [3, 15],
					[9, 3], [9, 9], [9, 15],
					[15, 3], [15, 9], [15, 15],
				];
				break;
			case 13:
				hoshiPositions  = [
					[3, 3], [3, 9],
					[6, 6],
					[9, 3], [9, 9],
				];
				break;
			case 9:
				hoshiPositions  = [
					[2, 2], [2, 6],
					[6, 2], [6, 6],
				];
				break;
		}
		for (const pos of hoshiPositions) {
			this.drawIntersectionDot("hoshi", pos[0], pos[1], {opacity: 1, radious: this.bandWidth / 5, color: "black"})
		}
	}

	drawIntersectionDot(idPrefix: string, row: number, col: number, params: {opacity?: any, color: string, radious: number}) {
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
				}
			};
		return div;
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
		for (const rowNo in this.goban.goban) {
			for (const colNo in this.goban.goban[rowNo]) {
			}
		}
		for (const coord in this.goban.labels) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, this.goban.labels[coord], { bandWidth: this.bandWidth, unit: this.unit, color: color });
		}
		for (const coord in this.goban.triangles) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, "△", { bandWidth: this.bandWidth, unit: this.unit, color: color });
		}
		for (const coord in this.goban.squares) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, "□", { bandWidth: this.bandWidth, unit: this.unit, color: color });
		}
		for (const coord in this.goban.crosses) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, "×", { bandWidth: this.bandWidth, unit: this.unit, color: color });
		}
		for (const coord in this.goban.circles) {
			let [row, col] = coordinateToRowColumn(coord);
			const color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
			this.drawLabel(row, col, "○", { bandWidth: this.bandWidth, unit: this.unit, color: color });
		}
		/*
	return <div style={{}}>
		<div ref={playableRef} id="goban" style={{position: "absolute", top: `${emptyBorder / 2}${unit}`, left: `${emptyBorder / 2}${unit}`, width: `${playableSide}${unit}`, height: `${playableSide}${unit}`}} onMouseMove={logCoordinates} onClick={logCoordinates} onMouseLeave={clearTmpStone} onMouseUp={onClick}>
			{!!(tmpStone && nextColor) && <Stone row={tmpStone[0]} column={tmpStone[1]} color={nextColor} bandWidth={bandWidth} unit={unit} opacity={0.25} />}
			{props.emptyIntersections && <EmptyIntersections bandWidth={bandWidth} margins={props.emptyIntersections} goban={props.goban} unit={props.unit} />}
			{props.invalidIntersections?.map((coords) => <IntersectionDot row={coords[0]} column={coords[1]} bandWidth={bandWidth} unit={props.unit} radious={bandWidth / 3} opacity={0.25} color="red" />)}
		</div>
	</div>
		*/
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

	private drawLabel(row: number, column: number, label: string, props: {bandWidth: number, unit: string, color: string}) {
		console.log(`Label ${label} on ${row},${column}`);
		const stoneId = `stone-${row}-${column}`;
		const stoneDiv = document.getElementById(stoneId);
		if (!stoneDiv) {
			console.error("no stone div found for id " + stoneId)
		}
		const div = getOrCreateElement(this.idPrefix, "div", `label-${row}-${column}`, {
			color: props.color,
			display: "flex",
			alignSelf: "center",
			justifySelf: "center",
			textAlign: "center",
			flexGrow: "1",
			justifyContent: "center",
			fontSize: `${props.bandWidth * 0.9}${props.unit}`
		}).element
		div.innerHTML = label;
		stoneDiv.appendChild(div);
		this.temporaryElements.push(div);
	}
}

/*
import { Fragment, h } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { SGFGoban } from '../../sgf/goban';
import { SGFColor, coordinateToRowColumn, rowColumnToCoordinate } from '../../sgf/sgf';

interface GobanProps {
	size: number;
	width?: number;
	unit?: string;
	goban: SGFGoban;
	emptyIntersections?: number[];
	invalidIntersections?: number[][];
	onClick?: (row: number, col: number) => void;
	markLastMove?: boolean;
}

export function Goban(props: GobanProps) {
	const playableRef = useRef<HTMLDivElement>();
	const side = props.width || 100;
	const emptyBorder = .5 * props.width / props.size;
	const playableSide = side - emptyBorder;
	const bandWidth = playableSide / props.size;
	const unit = props.unit || "vmin";
	const [tmpStone, setTmpStone] = useState(undefined as undefined | [number, number]);
	const goban = useRef(props.goban);
	if (goban.current != props.goban) {
		setTmpStone(undefined);
	}

	const getRowCol = (e: MouseEvent) => {
		const rect = playableRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left; //x position within the element.
		const y = e.clientY - rect.top;  //y position within the element.
		const row = Math.floor(props.size * y / rect.height);
		const col = Math.floor(props.size * x / rect.width);
		return [row, col];
	}

	const logCoordinates = (e: MouseEvent) => {
		e.preventDefault();
		let [row, col] = getRowCol(e);
		// console.log(`client: ${e.clientX},${e.clientY}, rect: ${rect.left},${rect.top} => ${x},${y} => ${x / rect.width},${y / rect.height} => ${row},${col}`)
		console.log(`Setting stone at ${row},${col}`)
		if (props.goban.isStoneAt(rowColumnToCoordinate([row, col]))) {
			setTmpStone(undefined);
		} else {
			setTmpStone([row, col]);
		}
	}

	const onClick = (e: MouseEvent) => {
		e.preventDefault();
		let [row, col] = getRowCol(e);
		props?.onClick(row, col);
		setTmpStone(undefined);
	}

	const clearTmpStone = (e: MouseEvent) => {
		e.preventDefault();
		console.log("Clearing stone?")
		console.log(e.relatedTarget)
		if (e.relatedTarget != playableRef.current) {
			console.log("Clearing stone!")
			setTmpStone(undefined);
		}
	}

	let nextColor: string;
	if (props.goban.nextToPlay == SGFColor.WHITE) {
		nextColor = "white";
	} else if (props.goban.nextToPlay == SGFColor.BLACK) {
		nextColor = "black";
	}

	return <div style={{width: `${side}${unit}`, height: `${side}${unit}`, backgroundColor: "orange", position: "relative", margin: "0 auto 0 auto"}}>
		<div ref={playableRef} id="goban" style={{position: "absolute", top: `${emptyBorder / 2}${unit}`, left: `${emptyBorder / 2}${unit}`, width: `${playableSide}${unit}`, height: `${playableSide}${unit}`}} onMouseMove={logCoordinates} onClick={logCoordinates} onMouseLeave={clearTmpStone} onMouseUp={onClick}>
			{Array.from(Array(props.size)).map((_, index) => <Fragment>
				<div style={{position: "absolute", height: `${playableSide - bandWidth}${unit}`, width: "0.5px", color: "black", top: `${bandWidth / 2}${unit}`, left: `${playableSide * index / props.size + bandWidth / 2.}${unit}`, backgroundColor: "black"}} />
				<div style={{position: "absolute", width: `${playableSide - bandWidth}${unit}`, height: "0.5px", color: "black", left: `${bandWidth / 2}${unit}`, top: `${playableSide * index / props.size + bandWidth / 2.}${unit}`, backgroundColor: "black"}} />
			</Fragment>)}
			{props.goban.goban.map((row, rowNo) => row.map((color, columnNo) => {
				switch (color) {
					case SGFColor.BLACK:
						return <Stone row={rowNo} column={columnNo} bandWidth={bandWidth} unit={unit} color={"black"}/>
					case SGFColor.WHITE:
						return <Stone row={rowNo} column={columnNo} bandWidth={bandWidth} unit={unit} color={"white"}/>
				}
			}
			))}
			{(props.markLastMove && props.goban.latestMove) && 
				<IntersectionDot radious={bandWidth / 3} row={coordinateToRowColumn(props.goban.latestMove)?.[0]} column={coordinateToRowColumn(props.goban.latestMove)?.[1]} color={props.goban.stoneAt(props.goban.latestMove) == SGFColor.BLACK ? "white" : "black"} bandWidth={bandWidth} unit={unit} />}
			{props.goban.labels && Object.keys(props.goban.labels)?.map(coordinate => {
				const rowCol = coordinateToRowColumn(coordinate)
				return <Label row={rowCol[0]} column={rowCol[1]} color={props.goban.stoneAt(coordinate) == SGFColor.BLACK ? "white" : "black"} bandWidth={bandWidth} unit={unit} label={props.goban.labels[coordinate]} />}
			)}
			{props.goban.triangles && Object.keys(props.goban.triangles)?.map(coordinate => {
				const rowCol = coordinateToRowColumn(coordinate)
				return <Label row={rowCol[0]} column={rowCol[1]} color={props.goban.stoneAt(coordinate) == SGFColor.BLACK ? "white" : "black"} bandWidth={bandWidth} unit={unit} label="△" />}
			)}
			{props.goban.squares && Object.keys(props.goban.squares)?.map(coordinate => {
				const rowCol = coordinateToRowColumn(coordinate)
				return <Label row={rowCol[0]} column={rowCol[1]} color={props.goban.stoneAt(coordinate) == SGFColor.BLACK ? "white" : "black"} bandWidth={bandWidth} unit={unit} label="□" />}
			)}
			{props.goban.crosses && Object.keys(props.goban.crosses)?.map(coordinate => {
				const rowCol = coordinateToRowColumn(coordinate)
				return <Label row={rowCol[0]} column={rowCol[1]} color={props.goban.stoneAt(coordinate) == SGFColor.BLACK ? "white" : "black"} bandWidth={bandWidth} unit={unit} label="×" />}
			)}
			{props.goban.circles && Object.keys(props.goban.circles)?.map(coordinate => {
				const rowCol = coordinateToRowColumn(coordinate)
				return <Label row={rowCol[0]} column={rowCol[1]} color={props.goban.stoneAt(coordinate) == SGFColor.BLACK ? "white" : "black"} bandWidth={bandWidth} unit={unit} label="○" />}
			)}
			{!!(tmpStone && nextColor) && <Stone row={tmpStone[0]} column={tmpStone[1]} color={nextColor} bandWidth={bandWidth} unit={unit} opacity={0.25} />}
			{props.emptyIntersections && <EmptyIntersections bandWidth={bandWidth} margins={props.emptyIntersections} goban={props.goban} unit={props.unit} />}
			{props.invalidIntersections?.map((coords) => <IntersectionDot row={coords[0]} column={coords[1]} bandWidth={bandWidth} unit={props.unit} radious={bandWidth / 3} opacity={0.25} color="red" />)}
		</div>
	</div>
}

function EmptyIntersections(props: {margins?: number[], goban: SGFGoban, bandWidth: number, unit: string, color?: string}) {
	if (!props.margins) {
		return null;
	}
	let [top, right, bottom, left] = props.margins;
	console.log(`${top} ${right} ${bottom} ${left}`)
	if (top + bottom >= props.goban.size) {
		return null;
	}
	if (left + right >= props.goban.size) {
		return null;
	}
	return <Fragment>
		{Array(props.goban.size).fill(undefined).map((_, row) => Array(props.goban.size).fill(undefined).map((_, col) => {
			if (col >= left && col < props.goban.size - right && row >= top && row < props.goban.size - bottom) {
				const stone = props.goban.stoneAt(rowColumnToCoordinate([row, col]));
				if (stone != SGFColor.BLACK && stone != SGFColor.WHITE) {
					return <IntersectionDot row={row} column={col} bandWidth={props.bandWidth} unit={props.unit} radious={props.bandWidth / 3} opacity={0.25} color={props.color} />
				}
				return null;
			}
		}))}
	</Fragment>
}

function Hoshi(props: {goban: SGFGoban, bandWidth: number, unit: string}) {
}

function IntersectionDot(props: {row: number, column: number, bandWidth: number, unit: string, radious: number, opacity?: number, color?: string}) {
	return <div style={{justifyContent: "center", alignContent: "center", display: "flex", flexDirection: "row", position: "absolute", width: `${props.bandWidth}${props.unit}`, height: `${props.bandWidth}${props.unit}`, top: `${props.row * props.bandWidth}${props.unit}`, left: `${props.column * props.bandWidth}${props.unit}`}}>
		<div style={{opacity: props.opacity ? props.opacity : 1, backgroundColor: props.color ? props.color : "black", borderRadius: `${props.radious}${props.unit}`, alignSelf: "center", justifySelf: "center", justifyContent: "center", width: `${props.radious}${props.unit}`, height: `${props.radious}${props.unit}` }}>
		</div>
	</div>
}

function Label(props: {row: number, column: number, bandWidth: number, unit: string, color: string, label: string}) {
	return <div style={{display: "flex", flexDirection: "row", position: "absolute", width: `${props.bandWidth}${props.unit}`, height: `${props.bandWidth}${props.unit}`, top: `${props.row * props.bandWidth}${props.unit}`, left: `${props.column * props.bandWidth}${props.unit}`}}>
		<div style={{color: props.color, display: "flex", alignSelf: "center", justifySelf: "center", textAlign: "center", flexGrow: 1, justifyContent: "center", fontSize: `${props.bandWidth * 0.9}${props.unit}`}}>
			{props.label}
		</div>
	</div>
}

function Stone(props: {row: number, column: number, bandWidth: number, unit: string, color: string, opacity?: number}) {
	return <div style={{display: "flex", justifyContent: "center", alignContent: "center", opacity: props?.opacity ? props.opacity : undefined, position: "absolute", borderRadius: `${props.bandWidth / 1}${props.unit}`, backgroundColor: props.color, width: `${props.bandWidth}${props.unit}`, height: `${props.bandWidth}${props.unit}`, top: `${props.row * props.bandWidth}${props.unit}`, left: `${props.column * props.bandWidth}${props.unit}`}}>
	</div>
}
*/