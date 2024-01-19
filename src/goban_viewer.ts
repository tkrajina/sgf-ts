import { SGFGoban } from "./goban";
import { parseSGF } from "./parser";
import { SGFColor, SGFNode, Tag, coordinateToRowColumn } from "./sgf";

function applyStyle(el: HTMLElement, style?: Partial<CSSStyleDeclaration>) {
	if (style) {
		for (const key of Object.keys(style)) {
			el.style[key] = style[key];
		}
	}
}

function getOrCreateElement(name: string, id: string, style?: Partial<CSSStyleDeclaration>) {
	const el = document.getElementById(id) || document.createElement(name);
	if (id) {
		el.id = id;
	}
	applyStyle(el, style);
	return el;
}

function createElement(name: string, id: string, style?: Partial<CSSStyleDeclaration>) {
	const el = getOrCreateElement(name, id);
	applyStyle(el, style);
	return el;
}

class GobanViewer {

	private positionViewer: GobanPositionViewer;

	rootNode: SGFNode;
	currentNode: SGFNode;
	goban: SGFGoban;

	constructor(private elementId: string, node?: SGFNode, opts?: GobanViewerOpts) {
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
		this.currentNode = node;
		this.positionViewer = new GobanPositionViewer(elementId, node, opts);
		this.goban = new SGFGoban();
	}

	next() {
		const child = this.currentNode.children?.[0];
		if (!child) {
			return;
		}
		this.currentNode = child;
		const path = this.rootNode.findPath(child);
		this.goban = new SGFGoban();
		this.goban.apply(...path);
		this.positionViewer.draw(this.goban);
	}

	previous() {
		const path = this.rootNode.findPath(this.currentNode);
		if ((path?.length || 0) < 2) {
			return;
		}
		path.pop();
		this.currentNode = path[path.length - 1];
		this.goban = new SGFGoban();
		this.goban.apply(...path);
		this.positionViewer.draw(this.goban);
	}

}

interface GobanViewerOpts {
	side?: number,
	unit?: string,
	cropTop: number,
	cropRight: number,
	cropBottom: number,
	cropLeft: number
}

class GobanPositionViewer {
	size = 19;
	originalSide: number;
	side = 50; // This can change when cropping and zooming
	bandWidth: number;
	unit = "vmin";
	goban: SGFGoban;

	rootElement: HTMLElement;
	gobanDiv: HTMLElement;

	cropTop = .25;
	cropRight = .25;
	cropBottom = 0;
	cropLeft = 0;

	/** Elements to be deleted before every position change */
	temporaryElements: HTMLElement[] = [];

	constructor(private elementId: string, node: SGFNode, opts?: GobanViewerOpts) {
		this.side = opts?.side || 50;
		this.originalSide = this.side;
		this.unit = opts?.unit || "vmin";
		this.rootElement = document.getElementById(this.elementId);
		this.cropTop = this.cropFactor(opts.cropTop);
		this.cropRight = this.cropFactor(opts.cropRight);
		this.cropBottom = this.cropFactor(opts.cropBottom);
		this.cropLeft = this.cropFactor(opts.cropLeft);
		if (!this.rootElement) {
			alert("no goban element found");
			return;
		}
		this.size = parseInt(node.findFirstProperty(Tag.Size)) || 19;
		this.drawGoban();
		const goban = new SGFGoban();
		goban.apply(node);
		this.draw(goban);
	}

	private cropFactor(cropFactor: number) {
		if (!cropFactor) {
			return 0;
		}
		if (cropFactor >= 1) {
			const res = cropFactor / this.size - 0.25 / this.size;
			console.log(`${cropFactor} -> ${res}`);
			return res;
		}
		const res = Math.round(this.size * cropFactor) / this.size - .25 / this.size;
		console.log(`${cropFactor} -> ${res}`);
		return res;
	}

	private drawGoban() {

		this.side = Math.min(
			this.originalSide / (1 - this.cropLeft - this.cropRight),
			this.originalSide / (1 - this.cropTop - this.cropBottom)
		);

		const containerWindowDiv = getOrCreateElement("div", "goban-container", {
			position: "relative",
			overflow: "hidden",
			width: `${(1 - this.cropRight - this.cropLeft) * this.side}${this.unit}`,
			height: `${(1 - this.cropBottom - this.cropTop) * this.side}${this.unit}`,
			margin: "0 auto 0 auto"
		});

		this.gobanDiv = getOrCreateElement("div", "goban_div", {
			width: `${this.side}${this.unit}`,
			height: `${this.side}${this.unit}`,
			backgroundColor: "#ebb063",
			position: "relative",
			top: `${(- this.cropTop) * this.side}${this.unit}`,
			left: `${(- this.cropLeft) * this.side}${this.unit}`,
		})
		this.rootElement.innerHTML = "";
		containerWindowDiv.appendChild(this.gobanDiv);
		this.rootElement.appendChild(containerWindowDiv);
		// const emptyBorder = .5 * this.side / this.size;
		const emptyBorder = 0;
		const playableSide = this.side - emptyBorder;
		this.bandWidth = playableSide / this.size;
		for (let index = 0; index < this.size; index++) {
			this.gobanDiv.appendChild(getOrCreateElement("div", `vertical-${index}`, {
				position: "absolute",
				height: `${playableSide - this.bandWidth}${this.unit}`,
				width: "0.5px",
				color: "black",
				top: `${this.bandWidth / 2}${this.unit}`,
				left: `${playableSide * index / this.size + this.bandWidth / 2.}${this.unit}`,
				backgroundColor: "black"
			}))
			this.gobanDiv.appendChild(getOrCreateElement("div", `horizontal-${index}`, {
				position: "absolute",
				width: `${playableSide - this.bandWidth}${this.unit}`,
				height: "0.5px",
				color: "black",
				left: `${this.bandWidth / 2}${this.unit}`,
				top: `${playableSide * index / this.size + this.bandWidth / 2.}${this.unit}`,
				backgroundColor: "black"
			}))
				// <div style={{}} />
		}
		this.drawHoshi();
		/*
	return <div style={{}}>
		<div ref={playableRef} id="goban" style={{position: "absolute", top: `${emptyBorder / 2}${unit}`, left: `${emptyBorder / 2}${unit}`, width: `${playableSide}${unit}`, height: `${playableSide}${unit}`}} onMouseMove={logCoordinates} onClick={logCoordinates} onMouseLeave={clearTmpStone} onMouseUp={onClick}>
			<Hoshi bandWidth={bandWidth} goban={props.goban} unit={props.unit} />
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
		*/
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
		const div = getOrCreateElement("div", `${idPrefix}-intersection-${row}-${col}`, {
			justifyContent: "center",
			alignContent: "center",
			display: "flex",
			flexDirection: "row",
			position: "absolute",
			width: `${this.bandWidth}${this.unit}`,
			height: `${this.bandWidth}${this.unit}`,
			top: `${row * this.bandWidth}${this.unit}`,
			left: `${col * this.bandWidth}${this.unit}`
		})
		div.appendChild(getOrCreateElement("div", `innext-hoshi-${row}-${col}`, {
			opacity: params.opacity ? params.opacity : 1,
			backgroundColor: params.color ? params.color : "black",
			borderRadius: `${params.radious}${this.unit}`,
			alignSelf: "center",
			justifySelf: "center",
			justifyContent: "center",
			width: `${params.radious}${this.unit}`,
			height: `${params.radious}${this.unit}`
		}))
		this.gobanDiv.appendChild(div);
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
				const id = `stone-${row}-${col}`;
				let stoneElement = document.getElementById(id);
				if (!stoneElement) {
					stoneElement = createElement("div", id);
					this.gobanDiv.appendChild(stoneElement);
				}
				if (cssColor) {
					applyStyle(stoneElement, {
						display: "flex",
						justifyContent: "center",
						alignContent: "center",
						// opacity: props?.opacity ? props.opacity : undefined,
						position: "absolute",
						borderRadius: `${this.bandWidth / 1}${this.unit}`,
						backgroundColor: cssColor,
						width: `${this.bandWidth}${this.unit}`,
						height: `${this.bandWidth}${this.unit}`,
						top: `${row * this.bandWidth}${this.unit}`,
						left: `${col * this.bandWidth}${this.unit}`,
						visibility: "visible",
					})
				} else {
					applyStyle(stoneElement, {visibility: "hidden"});
				}
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
		/*
			{props.goban.goban.map((row, rowNo) => row.map((color, columnNo) => {
				switch (color) {
					case SGFColor.BLACK:
						return <Stone row={rowNo} column={columnNo} bandWidth={bandWidth} unit={unit} color={"black"}/>
					case SGFColor.WHITE:
						return <Stone row={rowNo} column={columnNo} bandWidth={bandWidth} unit={unit} color={"white"}/>
				}
			}
			))}
		*/
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