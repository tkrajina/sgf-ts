import { SGFGoban } from "../src/goban";
import { parseSGF } from "../src/parser";
import { SGFColor, Tag } from "../src/sgf";

// (;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-04];B[aa];W[ba];B[ca];W[ab])

describe('flattening nodes', () => {
	test('no flatteing', () => {
		const node = parseSGF(`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[7]DT[2024-02-02];B[aa];W[ba])`);
		expect(node.flattenToNode(node, {propsToKeep: ["CA"]}).toSGF()).toBe(`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[7]DT[2024-02-02];B[aa];W[ba])`);
	}),
	test('flatten single move', () => {
		const node = parseSGF(`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[7]DT[2024-02-02];B[aa];W[ba])`);
		const goban = new SGFGoban();
		expect(node.children[0].children[0].getProperty(Tag.White)).toBe("ba");
		const flattened = node.flattenToNode(node.children[0].children[0], {propsToKeep: ["CA"]});
		expect(flattened.toSGF()).toBe("(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[7]DT[2024-02-02]AB[aa]AW[ba])");
		expect(flattened.children?.length).toBe(0);
		goban.applyNodes(flattened);
		expect(goban.debugStr()).toBe(`
BW.....
.......
.......
.......
.......
.......
.......
`.trim());
	})
	test('flatten with child nodes', () => {
		const node = parseSGF(`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[7]DT[2024-02-02];B[aa];W[ba](;B[ca])(;B[cb])(;B[bb]))`);
		const goban = new SGFGoban();
		expect(node.children[0].children[0].getProperty(Tag.White)).toBe("ba");
		const flattened = node.flattenToNode(node.children[0].children[0], {propsToKeep: ["CA"]});
		expect(flattened.toSGF()).toBe("(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[7]DT[2024-02-02]AB[aa]AW[ba](;B[ca])(;B[cb])(;B[bb]))");
		expect(flattened.children?.length).toBe(3);
		goban.applyNodes(flattened);
		expect(goban.debugStr()).toBe(`
BW.....
.......
.......
.......
.......
.......
.......
`.trim());
	}),
	test('flatten and keep next player color', () => {
		const node = parseSGF(`(;PL[B]DT[2024-02-02]SZ[7]AP[Sabaki:0.52.2]CA[UTF-8];B[aa];W[ba];B[ca])`);
		const ml = node.mainLine();
		const flattened = node.flattenToNode(ml[ml.length - 1], {propsToKeep: ["CA"]});
		const goban = new SGFGoban();
		goban.applyNodes(flattened);
		expect(flattened.getProperty(Tag.Player)).toBe(SGFColor.WHITE);
		expect(flattened.toSGF()).toBe("(;DT[2024-02-02]SZ[7]AP[Sabaki:0.52.2]CA[UTF-8]AB[aa][ca]AW[ba]PL[W])");
		expect(goban.debugStr()).toBe(`
BWB....
.......
.......
.......
.......
.......
.......
`.trim());
	})
	test('13x13 board size respected for liberty calculation', () => {
		const sgf = `(;DT[2026-04-12]SZ[13]AW[hb][hc][hd][he][hg][ia][ib][if][ja][jc][ka][ke][kf][la][ld][lf][ma][mc]AB[ic][id][jb][kb][kc][kd][lb][lc][le][mb][me]PL[W]AP[Sabaki:0.52.2]CA[UTF-8];W[jd])`;
		const node = parseSGF(sgf);
		const goban = new SGFGoban(19); // Wrong size, will be readjusted later

		// Verify the board size is 19
		expect(goban.size).toBe(19);

		// Apply the child node with W[jd]
		goban.applyNodes(node);
		// Verify the board size is 13
		expect(goban.size).toBe(13);
		expect(goban.debugStr()).toBe(`
........WWWWW
.......WWBBBB
.......WBWBBW
.......WB.BW.
.......W..WBB
........W.WW.
.......W.....
.............
.............
.............
.............
.............
.............
`.trim());

		// Check that setup stones are placed correctly
		expect(goban.stoneAt("ic")).toBe(SGFColor.BLACK);
		expect(goban.stoneAt("hc")).toBe(SGFColor.WHITE);

		// Apply the child node with W[jd]
		goban.applyNodes(node.children[0]);

		// Check that the move was played
		expect(goban.stoneAt("jd")).toBe(SGFColor.WHITE);

		// Verify the board is 13x13 by checking row length
		expect(goban.goban.length).toBe(13);
		expect(goban.goban[0].length).toBe(13);
		expect(goban.debugStr()).toBe(`
........WWWWW
.......WW....
.......WBW..W
.......WBW.W.
.......W..WBB
........W.WW.
.......W.....
.............
.............
.............
.............
.............
.............
`.trim());
	})
  });