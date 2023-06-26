import { SGFGoban } from "../src/goban";
import { coordinateToRowColumn, rowColumnToCoordinate, SGFColor, SGFNode, SGFProperty, Tag } from "../src/sgf";

// (;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-04];B[aa];W[ba];B[ca];W[ab])

describe('goban placements', () => {
	test('apply node with adding stones', () => {
		const g = new SGFGoban(5);
		console.log(g.debugStr())
		g.apply(new SGFNode([
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
		g.apply(new SGFNode([
			new SGFProperty(Tag.Black, [rowColumnToCoordinate([1, 5])]),
		], []));
		expect(g.debugStr()).toBe(`.....
.....
.....
.....
.....`);
	})
  });