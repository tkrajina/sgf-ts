import { formatDiagnostic } from "typescript";
import { SGFGoban } from "../src/goban";
import { coordinateToRowColumn, rowColumnToCoordinate, SGFColor } from "../src/sgf";

// (;AP[Sabaki:0.52.2]CA[UTF-8];B[aa];W[ba];B[ca];W[ab])
// (;AP[Sabaki:0.52.2]CA[UTF-8];B[aa];W[ba];B[ca];W[ab];B[rs])

describe('group info', () => {
	test('no group info', () => {
		const goban = new SGFGoban(9);
		goban.addStones(SGFColor.BLACK, rowColumnToCoordinate([3, 3]));
		const info = goban.getGroupInfo(rowColumnToCoordinate([0, 0]));
		expect(info.groupColor).toBe(SGFColor.NONE);
		expect(info.groupStones.length).toBe(0);
		expect(info.adjacentFreeSpaces.length).toBe(0);
		expect(info.adjacentStones.length).toBe(0);
	})
	test('center black group info', () => {
		const goban = new SGFGoban(9);

		goban.addStones(SGFColor.BLACK, rowColumnToCoordinate([3, 3]));
		{
			const info = goban.getGroupInfo(rowColumnToCoordinate([3, 3]));
			expect(info.groupColor).toBe(SGFColor.BLACK);
			expect(info.groupStones.length).toBe(1);
			expect(info.adjacentFreeSpaces.length).toBe(4);
			expect(info.adjacentStones.length).toBe(0);
		}

		goban.addStones(SGFColor.BLACK, rowColumnToCoordinate([3, 2]));
		{
			const info = goban.getGroupInfo(rowColumnToCoordinate([3, 3]));
			expect(info.groupColor).toBe(SGFColor.BLACK);
			expect(info.groupStones.length).toBe(2);
			expect(info.adjacentStones.length).toBe(0);
			expect(info.adjacentFreeSpaces.length).toBe(6);
		}

		goban.addStones(SGFColor.BLACK,
			rowColumnToCoordinate([3, 4]),
			rowColumnToCoordinate([3, 5]),
			rowColumnToCoordinate([3, 6]),
			rowColumnToCoordinate([3, 7]),
			rowColumnToCoordinate([3, 8]),
		);
		console.log(goban.debugStr())
		expect(goban.debugStr()).toBe(`
.........
.........
.........
..BBBBBBB
.........
.........
.........
.........
.........
`.trim())
		{
			const info = goban.getGroupInfo(rowColumnToCoordinate([3, 3]));
			expect(info.groupColor).toBe(SGFColor.BLACK);
			expect(info.groupStones.length).toBe(7);
			expect(info.adjacentStones.length).toBe(0);
			expect(info.adjacentFreeSpaces.length).toBe(15);
		}
		goban.addStones(SGFColor.BLACK,
			rowColumnToCoordinate([3, 2]),
			rowColumnToCoordinate([3, 1]),
			rowColumnToCoordinate([3, 0]),
		);
		expect(goban.debugStr()).toBe(`
.........
.........
.........
BBBBBBBBB
.........
.........
.........
.........
.........
`.trim())
		{
			const info = goban.getGroupInfo(rowColumnToCoordinate([3, 3]));
			expect(info.groupColor).toBe(SGFColor.BLACK);
			expect(info.groupStones.length).toBe(9);
			expect(info.adjacentStones.length).toBe(0);
			expect(info.adjacentFreeSpaces.length).toBe(18);
		}

		goban.addStones(SGFColor.WHITE,
			rowColumnToCoordinate([2, 0]),
			rowColumnToCoordinate([2, 1]),
			rowColumnToCoordinate([2, 2]),
			rowColumnToCoordinate([2, 3]),
			rowColumnToCoordinate([2, 4]),
			rowColumnToCoordinate([2, 5]),
			rowColumnToCoordinate([2, 6]),
			rowColumnToCoordinate([2, 7]),
			rowColumnToCoordinate([2, 8]),
		);
		{
			const info = goban.getGroupInfo(rowColumnToCoordinate([3, 3]));
			expect(info.groupColor).toBe(SGFColor.BLACK);
			expect(info.groupStones.length).toBe(9);
			expect(info.adjacentStones.length).toBe(9);
			expect(info.adjacentFreeSpaces.length).toBe(9);
		}
	})
	test('1 side white group info', () => {
		const goban = new SGFGoban(9);
		goban.addStones(SGFColor.BLACK, rowColumnToCoordinate([0, 3]));
		const info = goban.getGroupInfo(rowColumnToCoordinate([0, 3]));
		expect(info.groupColor).toBe(SGFColor.BLACK);
		expect(info.groupStones.length).toBe(1);
		expect(info.adjacentFreeSpaces.length).toBe(3);
		expect(info.adjacentStones.length).toBe(0);
	})
	test('invalid group', () => {
		const goban = new SGFGoban(9);
		goban.addStones(SGFColor.BLACK, rowColumnToCoordinate([0, 3]));
		const infos = [
			goban.getGroupInfo(rowColumnToCoordinate([-1, 3])),
			goban.getGroupInfo(rowColumnToCoordinate([300, 3])),
			goban.getGroupInfo(rowColumnToCoordinate([3, -1])),
			goban.getGroupInfo(rowColumnToCoordinate([3, 300])),
		]
		for (const info of infos) {
			expect(info.groupColor).toBe(SGFColor.INVALID);
			expect(info.groupStones.length).toBe(0);
			expect(info.adjacentFreeSpaces.length).toBe(0);
			expect(info.adjacentStones.length).toBe(0);
		}
	})
  });