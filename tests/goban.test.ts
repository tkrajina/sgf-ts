import { SGFGoban } from "../src/goban";
import { parseSGF } from "../src/parser";
import { coordinateToRowColumn, rowColumnToCoordinate, SGFColor, SGFNode, SGFProperty, Tag } from "../src/sgf";

// (;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-04];B[aa];W[ba];B[ca];W[ab])

describe('goban placements', () => {
	test('apply node with adding stones', () => {
		const g = new SGFGoban(5);
		console.log(g.debugStr())
		g.applyNodes(new SGFNode([
			new SGFProperty(Tag.AddBlack, ["aa"]),
			new SGFProperty(Tag.AddWhite, ["ab"]),
			new SGFProperty(Tag.AddBlack, [rowColumnToCoordinate([3, 4])]),
		], []));
		expect(g.stoneAt("aa")).toBe(SGFColor.BLACK);
		expect(g.stoneAt("ab")).toBe(SGFColor.WHITE);
		expect(g.stoneAt(coordinateToRowColumn("aa"))).toBe(SGFColor.BLACK);
		expect(g.stoneAt(coordinateToRowColumn("ab"))).toBe(SGFColor.WHITE);
		expect(g.row(0).join("")).toBe("B....")
		expect(g.row(1).join("")).toBe("W....")
		expect(g.column(0).join("")).toBe("BW...")
		expect(g.column(1).join("")).toBe(".....")
		expect(g.debugStr()).toBe(`B....
W....
.....
....B
.....`);
	})
	test('ignore invalid placement', () => {
		const g = new SGFGoban(5);
		console.log(g.debugStr())
		g.applyNodes(new SGFNode([
			new SGFProperty(Tag.Black, [rowColumnToCoordinate([1, 5])]),
		], []));
		expect(g.debugStr()).toBe(`.....
.....
.....
.....
.....`);
	})
	test('disallow suicide', () => {
		const node = parseSGF(`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[7]DT[2024-01-26]AB[ab][bb][cb][db][da][ag][cg][ae][be][ce][de][ee][ef][eg]AW[aa][ca][gb][fc][gd][af][bf][cf][df][dg])`)
		const g = new SGFGoban(node);
		expect(g.debugStr()).toBe(`W.WB...
BBBB..W
.....W.
......W
BBBBB..
WWWWB..
B.BWB..`);
		try {
			g.playStone(SGFColor.WHITE, rowColumnToCoordinate([0, 1]));
			fail("suicide!");
		} catch (e) {
			expect(g.debugStr()).toBe(`W.WB...
BBBB..W
.....W.
......W
BBBBB..
WWWWB..
B.BWB..`);
			expect(e.message).toBe("Suicide not allowed");
		}
		try {
			g.playStone(SGFColor.BLACK, rowColumnToCoordinate([2, 6]));
			fail("suicide!");
		} catch (e) {
			expect(e.message).toBe("Suicide not allowed");
		}
			expect(g.debugStr()).toBe(`W.WB...
BBBB..W
.....W.
......W
BBBBB..
WWWWB..
B.BWB..`);
		g.playStone(SGFColor.BLACK, rowColumnToCoordinate([6, 1]));
			expect(g.debugStr()).toBe(`W.WB...
BBBB..W
.....W.
......W
BBBBB..
....B..
BBB.B..`);
	})
  });