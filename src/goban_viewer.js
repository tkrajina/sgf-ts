var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SGFGoban } from "./goban";
import { parseSGF } from "./parser";
import { SGFColor, SGFNode, Tag, coordinateToRowColumn, rowColumnToCoordinate } from "./sgf";
const BACKGROUND_COLOR = "#ebb063";
const AUTOPLAY_INTERVAL = 400;
const coordinatesLetters = "abcdefghjklmnopqrst";
const correctWords = ["correct", "točno", "+", "right"];
function applyStyle(el, style) {
    if (style) {
        for (const key of Object.keys(style)) {
            el.style[key] = style[key];
        }
    }
}
function getElement(prefix, id) {
    id = prefix + "_" + id;
    return document.getElementById(id);
}
function getOrCreateElement(prefix, name, id, style, innerHTML) {
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
function createElement(prefix, name, id, style) {
    const el = getOrCreateElement(prefix, name, id);
    applyStyle(el.element, style);
    return el;
}
var GobanViewerMode;
(function (GobanViewerMode) {
    GobanViewerMode["PLAY"] = "PLAY";
    GobanViewerMode["PROBLEM"] = "PROBLEM";
    GobanViewerMode["GUESS_MOVE"] = "GUESS_MOVE";
})(GobanViewerMode || (GobanViewerMode = {}));
class AbstractGobanViewer {
    constructor(elementId, node) {
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
            }
            catch (e) {
                alert("no sgf found");
                return;
            }
        }
        this.rootNode = node;
        this.currentNode = node;
    }
    draw(opts) {
        if (opts) {
            opts.onClick = (row, col, color) => {
                this.onClick(row, col, color);
            };
        }
        this.positionViewer = new GobanPositionViewer(this.elementId, this.rootNode.findPath(this.currentNode), opts);
        this.goban = this.positionViewer.goban;
        this.updateComment();
        this.updateNextToPlay();
    }
    updateComment() {
        const c = getElement(this.elementId, "comment");
        if (c) {
            let { comment } = this.getCommentAndDirectives(this.currentNode);
            c.innerHTML = (comment === null || comment === void 0 ? void 0 : comment.split("\n").filter(line => (line === null || line === void 0 ? void 0 : line[0]) !== "!").join("<br/>")) || "";
        }
    }
    reset() {
        this.goTo(this.rootNode);
    }
    goTo(node) {
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
            }
            else if (this.goban.nextToPlay === SGFColor.WHITE) {
                turnEl.style.color = "white";
            }
        }
    }
    getPropertyOrCommandDirective(name, node) {
        let { directives } = this.getCommentAndDirectives(node);
        if (directives[name.toUpperCase()]) {
            return directives[name.toUpperCase()];
        }
        return node.getProperty(name.toUpperCase());
    }
    getCommentAndDirectives(node) {
        let commentCleaned = [];
        let directives = {};
        const comments = node.getProperties(Tag.Comment);
        if (comments && comments.length > 0) {
            for (const comment of comments) {
                console.log("comment:" + comment);
                for (let line of comment.split("\n")) {
                    line = line.trim();
                    console.log("line:" + line);
                    if (line && line[0] === "!") {
                        line = line.substring(1);
                        const parts = line.split(/\s+/);
                        const key = parts.shift().toUpperCase();
                        const val = parts.join(" ").trim();
                        directives[key] = val || "true";
                    }
                    else {
                        commentCleaned.push(line);
                    }
                }
            }
        }
        return { comment: commentCleaned.join("\n"), directives: directives };
    }
}
class ProblemGobanViewer extends AbstractGobanViewer {
    constructor(elementId, node, opts) {
        var _a;
        super(elementId, node);
        this.initialSkip = 0;
        this.showSolution = false;
        this.autoPlayColor = undefined;
        this.animationSpeed = 1;
        this.solutionPathLengths = [];
        this.opts = opts || {};
        this.parseDirectives();
        if (this.initialSkip > 0) {
            const goban = new SGFGoban();
            let tmpNode = this.rootNode;
            for (let i = 0; i < this.initialSkip; i++) {
                goban.applyNodes(tmpNode);
                tmpNode = (_a = tmpNode.children) === null || _a === void 0 ? void 0 : _a[0];
            }
            this.rootNode = this.rootNode.flattenToNode(tmpNode);
            this.rootNode.children = tmpNode.children;
            this.currentNode = this.rootNode;
        }
        this.fillSolutionsMetadata(this.rootNode);
        let [color] = this.rootNode.playerAndCoordinates();
        this.autoPlayColor = color;
        super.draw(Object.assign({ mode: GobanViewerMode.PROBLEM }, this.opts));
    }
    ;
    resetAnimation() {
        clearInterval(this.autoPlayTimeout);
        clearTimeout(this.autoPlayTimeout);
        this.autoPlayTimeout = null;
    }
    parseDirectives() {
        for (const node of this.rootNode.mainLine()) {
            const crop = this.getPropertyOrCommandDirective("crop", node);
            if (crop) {
                if (crop == "auto" || crop == "square") {
                    this.opts.crop = crop;
                }
                else {
                    const parts = crop.trim().split(/[\s,]+/) || ["0", "0", "0", "0"];
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
                let ankiFrom = parseInt(anki);
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
    fillSolutionsMetadata(node) {
        let solutionFound = 0;
        this.solutionPathLengths = [];
        node.walk((node, path) => {
            var _a, _b, _c;
            if (!((_a = node.children) === null || _a === void 0 ? void 0 : _a.length)) {
                let isSolution = false;
                const com = node === null || node === void 0 ? void 0 : node.getComment();
                for (const word of correctWords) {
                    if (((_c = (_b = com === null || com === void 0 ? void 0 : com.trim()) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === null || _c === void 0 ? void 0 : _c.indexOf(word)) == 0) {
                        isSolution = true;
                        for (const e of path) {
                            e.pathToSolution = true;
                            solutionFound++;
                        }
                    }
                }
                if (isSolution) {
                    node.solution = true;
                    this.solutionPathLengths.push(path.length);
                    solutionFound++;
                }
                else {
                    node.failure = true;
                }
            }
        });
        if (!solutionFound) {
            console.log("Solution is not specified in the SGF => assume main line is solution");
            const path = this.rootNode.mainLine();
            for (const node of path) {
                node.pathToSolution = true;
            }
            path[path.length - 1].solution = true;
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
        }
        else {
            this.goTo(this.currentNode);
        }
    }
    goTo(node) {
        var _a, _b;
        super.goTo(node);
        if (node === null || node === void 0 ? void 0 : node.solution) {
            this.positionViewer.setBgLabel("✓", "green", { opacity: 0.6 });
            (_b = (_a = this.opts) === null || _a === void 0 ? void 0 : _a.onCorrect) === null || _b === void 0 ? void 0 : _b.call(_a, this.currentNode);
        }
        else if (node === null || node === void 0 ? void 0 : node.failure) {
            this.positionViewer.setBgLabel("✗", "red", { opacity: 0.6 });
        }
        else if (node === null || node === void 0 ? void 0 : node.offPath) {
            this.positionViewer.setBgLabel("?", "gray", { opacity: 0.25 });
        }
        this.markSolutions();
    }
    markSolutions() {
        const node = this.currentNode;
        if (this.showSolution) {
            for (const subnode of (node === null || node === void 0 ? void 0 : node.children) || []) {
                let [color, coords] = subnode.playerAndCoordinates();
                let [row, col] = coordinateToRowColumn(coords);
                if ((subnode === null || subnode === void 0 ? void 0 : subnode.pathToSolution) || (subnode === null || subnode === void 0 ? void 0 : subnode.solution)) {
                    this.positionViewer.drawLabel(row, col, "✓", { color: "green", fontScale: .9 });
                }
                else {
                    this.positionViewer.drawLabel(row, col, "✗", { color: "red", fontScale: .9 });
                }
            }
        }
    }
    onClick(row, col, color) {
        var _a;
        if (this.autoPlayTimeout) {
            return;
        }
        const coord = rowColumnToCoordinate([row, col]);
        for (const i in ((_a = this.currentNode) === null || _a === void 0 ? void 0 : _a.children) || []) {
            const child = this.currentNode.children[i];
            let [_, childCoord] = child.playerAndCoordinates();
            if (coord == childCoord) {
                if (child === null || child === void 0 ? void 0 : child.pathToSolution) {
                    console.log("yes");
                }
                this.goTo(child);
                if (!this.showSolution) {
                    this.autoPlayTimeout = setTimeout(() => {
                        var _a;
                        this.autoPlayTimeout = null;
                        if (!((_a = child.children) === null || _a === void 0 ? void 0 : _a.length)) {
                            return;
                        }
                        const first = (child.children || []).find((sub => {
                            if (sub.pathToSolution) {
                                return true;
                            }
                        }));
                        if (first) {
                            this.goTo(first);
                        }
                        this.goTo(child.children[0]);
                    }, 2 * 250);
                }
                return;
            }
        }
        const node = (new SGFNode());
        node.offPath = true;
        node.setProperty(Tag.Comment, "Wrong (off path)");
        node.setMove(color, coord);
        try {
            this.goban.applyNodes(node); // TODO: Check for errors
            this.currentNode.appendNode(node);
            this.goTo(node);
        }
        catch (e) {
            console.error(e);
        }
    }
    next() {
        var _a;
        if (this.autoPlayTimeout) {
            return;
        }
        const node = (_a = this.currentNode.children) === null || _a === void 0 ? void 0 : _a[0];
        if (!node) {
            return;
        }
        this.goTo(node);
    }
    animate(nodes, interval = AUTOPLAY_INTERVAL) {
        this.resetAnimation();
        if (this.autoPlayTimeout) {
            return;
        }
        let i = 0;
        this.autoPlayTimeout = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            this.goTo(nodes[i]);
            i++;
            if (i >= nodes.length) {
                clearInterval(this.autoPlayTimeout);
                this.autoPlayTimeout = null;
            }
        }), interval / this.animationSpeed);
    }
    animateSolution(interval = AUTOPLAY_INTERVAL) {
        let firstSolution = [];
        this.rootNode.walkUntil((node, path) => {
            if (node === null || node === void 0 ? void 0 : node.solution) {
                firstSolution = path;
                return true;
            }
            return false;
        });
        if (firstSolution.length > 0) {
            this.animate(firstSolution, interval);
        }
    }
    previous() {
        if (this.autoPlayTimeout) {
            return;
        }
        const path = this.rootNode.findPath(this.currentNode);
        if (((path === null || path === void 0 ? void 0 : path.length) || 0) <= 1) {
            return;
        }
        path.pop();
        this.goTo(path[path.length - 1]);
    }
}
class GobanPositionViewer {
    constructor(elementId, nodeOrNodes, opts) {
        this.elementId = elementId;
        this.size = 19;
        /** Side of the goban including the cropped parts */
        this.width = 80; // This can change when cropping and zooming
        this.bandWidth = 0;
        this.unit = "vmin";
        this.cropTop = 0;
        this.cropRight = 0;
        this.cropBottom = 0;
        this.cropLeft = 0;
        /** Elements to be deleted before every position change */
        this.temporaryElements = [];
        this.coordinates = false;
        let node;
        let nodes;
        if (nodeOrNodes.pop) {
            nodes = nodeOrNodes;
            node = nodes[0];
        }
        else {
            node = nodeOrNodes;
            nodes = [node];
        }
        this.idPrefix = elementId;
        this.width = (opts === null || opts === void 0 ? void 0 : opts.side) || 80;
        this.originalWidth = this.width;
        this.unit = (opts === null || opts === void 0 ? void 0 : opts.unit) || "vmin";
        this.rootElement = document.getElementById(this.elementId);
        this.size = parseInt(node.findFirstProperty(Tag.Size) || "") || 19;
        if (opts === null || opts === void 0 ? void 0 : opts.crop) {
            if (opts.crop == "auto" || opts.crop == "square") {
                const bounds = node.bounds({ includeNonStones: true });
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
            }
            else {
                this.cropTop = this.cropFactor(opts.crop[0] || 0);
                this.cropRight = this.cropFactor(opts.crop[1] || 0);
                this.cropBottom = this.cropFactor(opts.crop[2] || 0);
                this.cropLeft = this.cropFactor(opts.crop[3] || 0);
            }
        }
        this.onClick = opts === null || opts === void 0 ? void 0 : opts.onClick;
        this.coordinates = (opts === null || opts === void 0 ? void 0 : opts.coordinates) || false;
        if (!this.rootElement) {
            alert("no goban element found");
            return;
        }
        this.drawGoban();
        const goban = new SGFGoban();
        goban.applyNodes(...nodes);
        this.draw(goban);
    }
    cropFactor(cropFactor) {
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
    gobanWidth() {
        return (1 - this.cropRight - this.cropLeft) * this.width;
    }
    gobanHeight() {
        return (1 - this.cropTop - this.cropBottom) * this.width;
    }
    drawGoban() {
        this.width = Math.min(this.originalWidth / (1 - this.cropLeft - this.cropRight), this.originalWidth / (1 - this.cropTop - this.cropBottom));
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
            top: `${(-this.cropTop) * this.width}${this.unit}`,
            left: `${(-this.cropLeft) * this.width}${this.unit}`,
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
            }).element);
            this.gobanDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `horizontal-${index}`, {
                position: "absolute",
                width: `${this.width - this.bandWidth}${this.unit}`,
                height: "0.5px",
                color: "black",
                left: `${this.bandWidth / 2}${this.unit}`,
                top: `${this.width * index / this.size + this.bandWidth / 2.}${this.unit}`,
                backgroundColor: "black"
            }).element);
        }
        this.drawHoshi();
        if (this.coordinates) {
            this.drawCoordinates(withCoordinatesDiv);
        }
    }
    setBgLabel(str, color = "black", opts) {
        applyStyle(this.bgLabelDiv, { color: color, opacity: (opts === null || opts === void 0 ? void 0 : opts.opacity) === undefined ? "1" : "" + opts.opacity });
        this.bgLabelDiv.innerHTML = str;
    }
    drawCoordinates(withCoordinatesDiv) {
        if (!this.coordinates) {
            return;
        }
        for (let i = 0; i < this.size; i++) {
            const top = (i + 1) * this.bandWidth - this.cropTop * this.width;
            let baseStyle = {
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
            };
            console.log(`label=${coordinatesLetters.charAt(i).toUpperCase() || `${i}`} top=${top}, height=${this.gobanHeight()} band=${this.bandWidth}`);
            if (0 < top && top <= this.gobanHeight()) {
                withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-left`, Object.assign(Object.assign({}, baseStyle), { top: `${top}${this.unit}`, left: "0px" }), `${this.size - i}`).element);
                withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-right`, Object.assign(Object.assign({}, baseStyle), { top: `${top}${this.unit}`, right: "0px" }), `${this.size - i}`).element);
            }
            const left = (i + 1) * this.bandWidth - this.cropLeft * this.width;
            if (0 < left && left <= this.gobanWidth()) {
                withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-top`, Object.assign(Object.assign({}, baseStyle), { top: "0px", left: `${left}${this.unit}` }), coordinatesLetters.charAt(i).toUpperCase() || `${i}`).element);
                withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", `coordinate-${i}-bottom`, Object.assign(Object.assign({}, baseStyle), { bottom: "0px", left: `${left}${this.unit}` }), coordinatesLetters.charAt(i).toUpperCase() || `${i}`).element);
            }
        }
    }
    drawHoshi() {
        let hoshiPositions = [];
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
            this.drawIntersectionDot("hoshi", pos[0], pos[1], { opacity: 1, radious: this.bandWidth / 5, color: "black" });
        }
    }
    drawIntersectionDot(idPrefix, row, col, params) {
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
        }).element;
        div.appendChild(getOrCreateElement(this.idPrefix, "div", `innext-hoshi-${row}-${col}`, {
            opacity: params.opacity ? params.opacity : 1,
            backgroundColor: params.color ? params.color : "black",
            borderRadius: `${params.radious}${this.unit}`,
            alignSelf: "center",
            justifySelf: "center",
            justifyContent: "center",
            width: `${params.radious}${this.unit}`,
            height: `${params.radious}${this.unit}`
        }).element);
        this.gobanDiv.appendChild(div);
        this.gobanDiv.onmouseleave = this.onMouseLeaveGoban.bind(this);
        this.gobanDiv.onmouseup = e => {
            var _a;
            if (this.mouseOverRow !== undefined && this.mouseOverCol !== undefined) {
                (_a = this === null || this === void 0 ? void 0 : this.onClick) === null || _a === void 0 ? void 0 : _a.call(this, this.mouseOverRow, this.mouseOverCol, this.goban.nextToPlay);
                this.showCoordinate();
            }
        };
        return div;
    }
    showCoordinate() {
        clearTimeout(this.coordinateTimeout);
        const el = getElement(this.elementId, "coordinate_clicked");
        if (el) {
            const coord = rowColumnToCoordinate([this.mouseOverRow, this.mouseOverCol]);
            el.innerHTML = `${coordinatesLetters.charAt(this.mouseOverCol).toUpperCase()}${this.size - this.mouseOverRow} / ${coord}`;
        }
        this.coordinateTimeout = setTimeout(() => {
            if (el)
                el.innerHTML = "";
        }, 1000);
    }
    draw(goban) {
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
            }));
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
    getStoneElement(row, col) {
        return document.getElementById(`${this.idPrefix}_stone-${row}-${col}`);
    }
    drawStone(row, col) {
        var _a, _b;
        const color = (_b = (_a = this.goban.goban) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[col];
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
        });
        if (this.getStoneElement(row, col) == stoneElement.element) {
            console.error("stone element id invalid!");
        }
        if (stoneElement.created) {
            this.gobanDiv.appendChild(stoneElement.element);
            stoneElement.element.row = row;
            stoneElement.element.col = col;
            stoneElement.element.onmouseenter = e => {
                const se = e.currentTarget;
                if ((se === null || se === void 0 ? void 0 : se.row) !== undefined && (se === null || se === void 0 ? void 0 : se.col) !== undefined) {
                    this.onMouseEnter(row, col);
                }
            };
        }
        if (cssColor) {
            applyStyle(stoneElement.element, {
                borderRadius: `${this.bandWidth / 1}${this.unit}`,
                backgroundColor: cssColor,
            });
        }
        else {
            applyStyle(stoneElement.element, {
                backgroundColor: "",
            });
        }
    }
    onMouseEnter(row, col) {
        if (row != this.mouseOverRow || col != this.mouseOverCol) {
            console.log(`on ${row},${col}`);
            this.mouseOverRow = row;
            this.mouseOverCol = col;
            let nextColor = "";
            if (this.goban.nextToPlay == SGFColor.WHITE) {
                nextColor = "white";
            }
            else if (this.goban.nextToPlay == SGFColor.BLACK) {
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
    onMouseLeaveGoban() {
        console.log(`out of goban`);
        this.mouseOverCol = undefined;
        this.mouseOverRow = undefined;
        applyStyle(this.tmpHoverStone, {
            visibility: "hidden",
        });
    }
    drawLabel(row, column, label, opts) {
        this.drawStone(row, column);
        console.log(`Label ${label} on ${row},${column}`);
        const stoneDiv = this.getStoneElement(row, column);
        if (!stoneDiv) {
            console.error("No stone element found");
            return;
        }
        const stone = this.goban.stoneAt(rowColumnToCoordinate([row, column]));
        let defaultStoneSide = label.length <= 1 ? 0.9 : 0.5;
        const div = getOrCreateElement(this.idPrefix, "div", `label-${row}-${column}`, {
            color: opts.color,
            backgroundColor: stone === SGFColor.NONE ? BACKGROUND_COLOR : undefined,
            display: "flex",
            alignSelf: "center",
            justifySelf: "center",
            textAlign: "center",
            width: `${this.bandWidth}${this.unit}`,
            height: `${this.bandWidth}${this.unit}`,
        }).element;
        const textDiv = getOrCreateElement(this.idPrefix, "span", `label-div-${row}-${column}`, {
            flexGrow: "1",
            display: "flex",
            alignSelf: "center",
            justifySelf: "center",
            justifyContent: "center",
            fontSize: `${this.bandWidth * ((opts === null || opts === void 0 ? void 0 : opts.fontScale) || defaultStoneSide)}${this.unit}`,
            fontWeight: "bold",
        });
        textDiv.element.innerHTML = label;
        div.appendChild(textDiv.element);
        stoneDiv.appendChild(div);
        this.temporaryElements.push(div);
    }
}
