import { SGFGoban } from "./goban";
import { parseSGF } from "./parser";
import { rowColumnToCoordinate, SGFColor, SGFNode, Tag } from "./sgf";

const NEXT_PLAYER_LABEL = "●";

const TAG_LABELS = {
	[Tag.Triangle]: "△",
	[Tag.Square]: "□",
	[Tag.Circle]: "○",
	[Tag.X]: "×",
	[Tag.Black]: NEXT_PLAYER_LABEL,
	[Tag.White]: NEXT_PLAYER_LABEL,
	[Tag.Label]: "special case", // overwritten later
};

const IS_NIGHT_MODE = !!document.getElementsByClassName("nightMode")?.length;
const IS_ANDROID = window.navigator.userAgent.toLowerCase().indexOf("android") > 0

let bgColor = "#ebb063";
let blackStoneColor = "black"
let whiteStoneColor = "white"

if (IS_NIGHT_MODE && IS_ANDROID) {
	console.log("android in dark mode!")
	bgColor = "#184c96"; // invert of original bgColor
	blackStoneColor = "white";
	whiteStoneColor = "black";
}

class Goban {

	private sgf: string;
	private containerElement: HTMLElement
	private gobanDiv: HTMLElement;
	initialSkip = 0;

	positions: SGFGoban[] = [];

	boardSize: number;
	bandWitdh: number;
	stoneSide: number;

	cropTop = 0;
	cropRight = 0;
	cropBottom = 0;
	cropLeft = 0;

	constructor(private originalSidePx: number) {
		this.drawGoban();
		if (this.positions?.length) {
			this.drawBoard(0);
		}
		this.initDownloadLink();
		if (this.initialSkip) {
			this.initialAnimation();
		}
	}

	getCommentAndDirectives(node: SGFNode) {
		let commentCleaned: string[] = [];
		let directives: {[name: string]: string} = {};
		const comments = node.getProperties(Tag.Comment);
		if (comments?.length > 0) {
			for (const comment of comments) {
				console.log("comment:" + comment);
				for (let line of comment.split("\n")) {
					console.log("line:" + line)
					if (line?.[0] === "!") {
						line = line.substring(1);
						const parts = line.split(/\s+/);
						directives[parts.shift().toUpperCase()] = parts.join(" ").trim() || "true";
					} else {
						commentCleaned.push(line)
					}
				}
			}
		}
		return {comment: commentCleaned.join("\n"), directives: directives};
	}

	getPropertyOrCommandDirective(name: string, node: SGFNode) {
		let {directives} = this.getCommentAndDirectives(node);
		if (directives[name]) {
			return directives[name];
		}
		return node.getProperty(name);
	}

	private parseGolangPositions(content: string) {
		content = content.
			replace(/<div.*?>/g, "\n").
			replace(/<br.*?>/g, "\n").
			replace(/<p.*?>/g, "\n").
			replace(/<.*?>/g, "");
		const rootNode = parseSGF(content);
		this.sgf = content;
		let goban = new SGFGoban(rootNode);

		const positions: SGFGoban[] = [];
		let n = 0;
		let node = rootNode;
		for (; ; node = node.children[0]) {
			n ++;
			if (positions.length == 1) {
				// Sometimes the first position has no "last move" => need to find out who's next:
				if (node.getProperty(Tag.White)) {
					positions[0].nextToPlay = SGFColor.WHITE;
				} else if (node.getProperty(Tag.Black)) {
					positions[0].nextToPlay = SGFColor.BLACK;
				}
			}
			this.autocrop(goban);
			const crop = this.getPropertyOrCommandDirective("CROP", node) || "";
			if (crop?.trim() && crop.trim() != "auto") {
				const parts = crop.trim().split(/[\s,]+/) || ["0","0","0","0"];
				this.cropTop = parseFloat(parts[0]) || 0;
				this.cropRight = parseFloat(parts[1]) || 0;
				this.cropBottom = parseFloat(parts[2]) || 0;
				this.cropLeft = parseFloat(parts[3]) || 0;
			}
			goban.apply(node);
			positions.push(goban);
			goban = goban.clone();

			const skip = this.getPropertyOrCommandDirective("SKIP", node);
			if (skip) {
				this.initialSkip = parseInt(skip);
			}

			const start = this.getPropertyOrCommandDirective("START", node);
			if (start !== undefined) {
				this.initialSkip = n - 1;
			}

			if (!node.children?.length) {
				break;
			}
		}

		let ankiFrom = parseInt(this.getPropertyOrCommandDirective("ANKI", node));
		if (!isNaN(ankiFrom)) {
			if (ankiFrom > 0) {
				ankiFrom = -ankiFrom;
			}
			this.initialSkip = n + ankiFrom - 1;
		}

		// for (const p of positions) {
		// 	console.log("pos:\n"+p.debugStr());
		// }
		return positions;
	}

	autocrop(goban: SGFGoban) {
		var rowMax = 0,
			rowMin = goban.size,
			colMax = 0,
			colMin = goban.size;
		//goban.debugStr();
		let stones = 0;
		const empty = (SGFColor.NONE as string).repeat(goban.size);
		for (let rowNo = 0; rowNo < goban.size; rowNo++) {
			const row = goban.row(rowNo).join("");
			if (row !== empty) {
				stones++;
				rowMax = Math.max(rowMax, rowNo);
				rowMin = Math.min(rowMin, rowNo);
			}
		}
		if (stones === 0) {
			return;
		}
		for (let colNo = 0; colNo < goban.size; colNo++) {
			const col = goban.column(colNo).join("");
			if (col !== empty) {
				colMax = Math.max(colMax, colNo);
				colMin = Math.min(colMin, colNo);
			}
		}
		if (colMax - colMin < goban.size / 2) {
			this.cropLeft = Math.min(1, Math.max(0, (colMin / goban.size) - .15));
			this.cropRight = Math.min(1, Math.max(0, 1 - (colMax / goban.size) - .15));
		}
		if (rowMax - rowMin < goban.size / 2) {
			this.cropTop = Math.min(1, Math.max(0, (rowMin / goban.size) - .15));
			this.cropBottom = Math.min(1, Math.max(0, 1 - (rowMax / goban.size) - .15));
		}
	}

	drawGoban() {
		this.containerElement = document.getElementById("goban")
		this.positions = this.parseGolangPositions(this.containerElement.innerHTML.trim());

		const sidePx = Math.min(
			this.originalSidePx / (1 - this.cropLeft - this.cropRight),
			this.originalSidePx / (1 - this.cropTop - this.cropBottom)
		);

		this.boardSize = this.positions[0].size;
		console.log(`board size: ${this.boardSize}`);
		this.bandWitdh = sidePx / this.boardSize;
		this.stoneSide = this.bandWitdh * 0.95;

		const containerWindowDiv = document.createElement("div")
		containerWindowDiv.style.position = "relative";
		containerWindowDiv.style.overflow = "hidden";
		//containerWindowDiv.style.border = "5px solid red";
		containerWindowDiv.style.width = `${(1 - this.cropRight - this.cropLeft) * sidePx}px`;
		containerWindowDiv.style.height = `${(1 - this.cropBottom - this.cropTop) * sidePx}px`;

		this.gobanDiv = document.createElement("div");
		this.gobanDiv.style.position = "absolute";
		this.gobanDiv.style.top = `${(- this.cropTop) * sidePx}px`;
		this.gobanDiv.style.left = `${(- this.cropLeft) * sidePx}px`;
		this.gobanDiv.style.overflow = "hidden";
		this.gobanDiv.style.marginBottom = `${-50}px`;
		this.gobanDiv.style.backgroundColor = bgColor;
		this.gobanDiv.style.width = `${sidePx}px`;
		this.gobanDiv.style.height = `${sidePx}px`;
		containerWindowDiv.appendChild(this.gobanDiv);

		const gobanLinesDiv = document.createElement("div");
		gobanLinesDiv.style.position = "absolute";
		gobanLinesDiv.style.width = `${sidePx}px`;
		gobanLinesDiv.style.height = `${sidePx}px`;
		gobanLinesDiv.style.left = `${this.bandWitdh / 2}px`;
		gobanLinesDiv.style.top = `${this.bandWitdh / 2}px`;
		gobanLinesDiv.style.backgroundColor = bgColor;
		this.gobanDiv.appendChild(gobanLinesDiv);

		for (let i = 0; i < this.boardSize; i++) {
			for (let j = 0; j < 2; j++) {
				const lineDiv = document.createElement("div");
				lineDiv.style.border = "0.5px solid gray";
				lineDiv.style.position = "absolute";
				lineDiv.style.borderWidth = "1px 1px 0px 0px";
				if (j == 0) {
					lineDiv.style.width = `0.5px`;
					lineDiv.style.height = `${sidePx - this.bandWitdh}px`;
					lineDiv.style.left = `${i*this.bandWitdh - 1}px`;
					lineDiv.style.top = `${0}px`;
				} else {
					lineDiv.style.width = `${sidePx - this.bandWitdh}px`;
					lineDiv.style.height = `1px`;
					lineDiv.style.top = `${i*this.bandWitdh - 1}px`;
					lineDiv.style.left = `${0}px`;
				}
				gobanLinesDiv.appendChild(lineDiv);
			}
		}

		this.containerElement.innerHTML = "";
		this.containerElement.appendChild(containerWindowDiv);
		this.drawHoshi();
	}

	drawBoard(position?: number) {
		if ("number" === typeof position) {
			this.position = position as number;
		}
		if (this.position >= this.positions.length - 1) {
			this.stopAnimation();
		}
		this.position = this.position % this.positions.length
		if (this.position < 0) {
			this.position += this.positions.length;
		}
		const el = document.getElementById("goban_position")
		if (el) {
			el.innerHTML = `${this.position + 1}/${this.positions.length}`;
		}
		this.drawStones(this.positions[this.position]);
	}

	private drawHoshi() {
		const hoshiRadious = this.stoneSide / 4;
		let hoshiPositions: [number, number][]  = [];
		switch (this.boardSize) {
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
			let row = pos[0], column = pos[1];
			const id = `hoshi-${row}-${column}`;
			const hoshiDiv = document.createElement("div");
			hoshiDiv.id = id;
			hoshiDiv.style.position = "absolute";
			hoshiDiv.style.textAlign = "center";
			hoshiDiv.style.left = `${(0.5 + column) * this.bandWitdh - 0.5 * hoshiRadious}px`;
			hoshiDiv.style.top = `${(0.5 + row) * this.bandWitdh - 0.5 * hoshiRadious}px`;
			hoshiDiv.style.width = `${hoshiRadious}px`;
			hoshiDiv.style.height = `${hoshiRadious}px`;
			hoshiDiv.style.backgroundColor = "gray";
			hoshiDiv.style.borderRadius = `${hoshiRadious * 0.5}px`;
			this.gobanDiv.appendChild(hoshiDiv);
		}
	}

	private drawStones(g: SGFGoban) {
		for (let col = 0; col < this.boardSize; col++) {
			for (let row = 0; row < this.boardSize; row++) {
				this.drawStone(g, row, col);
			}
		}
		let turnEl = document.getElementById("goban_turn");
		if (turnEl) {
			turnEl.style.backgroundColor = bgColor;
			if (g.nextToPlay === SGFColor.BLACK) {
				turnEl.style.color = blackStoneColor;
			} else if (g.nextToPlay === SGFColor.WHITE) {
				turnEl.style.color = whiteStoneColor;
			}
		}
		let commentsEl = document.getElementById("goban_comment");
		console.log("draw with comment" + g.comment);
		if (commentsEl) {
			commentsEl.innerHTML = g.comment?.split("\n").filter(line => line?.[0] !== "!").join("<br/>") || "";
		}
	}

	drawStone(g: SGFGoban, row: number, column: number) {
		const id = `stone-${row}-${column}`;
		const existingDiv = document.getElementById(id)
		const stoneDiv = existingDiv || document.createElement("div");
		if (!existingDiv) {
			stoneDiv.id = id;
			stoneDiv.style.position = "absolute";
			stoneDiv.style.textAlign = "center";
			stoneDiv.style.left = `${(0.5 + column) * this.bandWitdh - 0.5 * this.stoneSide}px`;
			stoneDiv.style.top = `${(0.5 + row) * this.bandWitdh - 0.5 * this.stoneSide}px`;
			stoneDiv.style.width = `${this.stoneSide}px`;
			stoneDiv.style.height = `${this.stoneSide}px`;
			stoneDiv.onclick = () => {
				const coord = rowColumnToCoordinate([row, column]);
				let commentsEl = document.getElementById("goban_comment");
				if (commentsEl) {
					commentsEl.innerHTML = "Position: " + coord;
				} else {
					alert("Location " + coord);
				}
			}
			this.gobanDiv.appendChild(stoneDiv);
		}
		stoneDiv.innerHTML = "";

		const coord = rowColumnToCoordinate([row, column]);
		const stone = g.stoneAt(coord);
		//console.log(`stone at (${row}, ${column}): ${stone}`);
		switch (stone) {
			case SGFColor.NONE:
				stoneDiv.style.backgroundColor = null;
				break;
			case SGFColor.BLACK:
				stoneDiv.style.backgroundColor = blackStoneColor;
				break;
			case SGFColor.WHITE:
				stoneDiv.style.backgroundColor = whiteStoneColor;
				break;
		}

		let label = g.labels[coord] || "";
		if (g.triangles[coord]) { label = "△"; }
		if (g.squares[coord]) { label = "□"; }
		if (g.crosses[coord]) { label = "×"; }
		if (g.circles[coord]) { label = "○"; }

		const isLatestMove = coord == g.latestMove;
		if (label || isLatestMove) {
			const centerDiv = document.createElement("div");
			if (isLatestMove) {
				centerDiv.innerHTML = NEXT_PLAYER_LABEL;
			} else {
				centerDiv.innerHTML = label;
			}
			centerDiv.style.position = "absolute";
			switch (stone) {
			case SGFColor.WHITE:
				centerDiv.style.color = blackStoneColor;
				break;
			case SGFColor.BLACK:
				centerDiv.style.color = whiteStoneColor;
				break;
			default:
				centerDiv.style.color = blackStoneColor;
			}
			centerDiv.style.left = "50%";
			centerDiv.style.top = "50%";
			centerDiv.style.transform = "translate(-50%, -55%)";
			centerDiv.style.fontSize = `${this.stoneSide * 0.75}px`;
			centerDiv.style.textAlign = "center";
			stoneDiv.appendChild(centerDiv);
		}

		stoneDiv.style.borderRadius = `${this.stoneSide * 0.5}px`;
	}

	initialAnimation() {
		if (this.initialSkip > 0) {
			this.animateFromTo(200, 200, 0, this.initialSkip);
		}
	}

	animationTimeout: any;
	animationInterval: any;
	position = 0;

	public animate(initDelay?: number, interval?: number) {
		this.animateFromTo(initDelay, interval, this.initialSkip);
	}

	public animateFromTo(initDelay?: number, interval?: number, from: number = 0, to?: number) {
		this.stopAnimation();
		let n = from;
		to = to || 10000000;
		this.drawBoard(n);
		this.animationTimeout = setTimeout(() => {
			this.drawBoard(++n);
			if (n >= this.positions.length - 1) {
				return;
			}
			this.animationInterval = setInterval(() => {
				if (n >= to) {
					return;
				}
				this.drawBoard(++n);
			}, interval)
		}, initDelay);
	}

	public stopAnimation() {
		clearTimeout(this.animationTimeout);
		clearInterval(this.animationInterval);
	}

	public next() {
		this.stopAnimation();
		this.drawBoard(this.position + 1);
	}
	public previous() {
		this.stopAnimation();
		this.drawBoard(this.position - 1);
	}
	public first() {
		this.stopAnimation();
		this.drawBoard(0);
		this.initialAnimation();
	}
	public last() {
		this.stopAnimation();
		this.drawBoard(this.positions.length - 1);
	}

	public initDownloadLink() {
		//document.getElementsByTagName("html")[0].innerHTML = sgf;
		/* Doesn't work in Anki (only in the browser):
		try {
			var element = document.createElement('a');
			element.innerHTML = "Download SGF";
			element.setAttribute('href', 'data:application/x-go-sgf;charset=utf-8,' + encodeURIComponent(sgf));
			const fileName = new Date().toJSON().replace(/[^\d]/g, "") + ".sgf";
			element.setAttribute('download', fileName);

			//element.style.display = 'none';
			//document.body.appendChild(element);
			//element.click();
			//document.body.removeChild(element);

			let commentsEl = document.getElementById("goban_comment");
			commentsEl.innerHTML = "";
			commentsEl?.appendChild(element);
		} catch (e) {
			console.error(e);
		}
		*/

		// try {
		// 	navigator.clipboard.writeText(sgf).then(() => {
		// 		alert("Copied to clipboard");
		// 	}, () => {
		// 		console.log("Can't copy to clipboard");
		// 	});
		// } catch (e) {
		// 	console.error(e);
		// }

		let showSgfLink = document.getElementById("sgf_show");
		if (showSgfLink) {
			showSgfLink.onclick = this.showSgf.bind(this);
		}

		var editSgfLink = document.getElementById("sgf_editor");
		if (editSgfLink) {
			const url = 'https://tkrajina.github.io/besogo/sgf.html?sgf=' + encodeURIComponent(this.sgf.replace("FN[", "SO["))
			editSgfLink.setAttribute('href', url);
		}
	}

	showSgf() {
		this.stopAnimation();
		let commentsEl = document.getElementById("goban_comment");
		commentsEl.innerHTML = "SGF:<br/>";
		const textarea = document.createElement("textarea")
		textarea.cols = 50;
		textarea.rows = 5;
		textarea.value = this.sgf.replace("FN[", "SO[");
		commentsEl.appendChild(textarea);
		textarea.select();
	}
}