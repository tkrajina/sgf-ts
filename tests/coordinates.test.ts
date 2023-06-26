import { coordinateToRowColumn, rowColumnToCoordinate } from "../src/sgf";

// (;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-04];B[aa];W[ba];B[ab];W[bb])

describe('sgf to coord', () => {
	test('coordinates', () => {
		expect(JSON.stringify(coordinateToRowColumn("aa"))).toBe("[0,0]");
		expect(JSON.stringify(coordinateToRowColumn("ba"))).toBe("[0,1]");
		expect(JSON.stringify(coordinateToRowColumn("ab"))).toBe("[1,0]");
		expect(JSON.stringify(coordinateToRowColumn("rs"))).toBe("[18,17]");

		expect(rowColumnToCoordinate([0,0])).toBe("aa");
		expect(rowColumnToCoordinate([0,1])).toBe("ba");
		expect(rowColumnToCoordinate([1,0])).toBe("ab");
		expect(rowColumnToCoordinate([18,17])).toBe("rs");
	})
  });