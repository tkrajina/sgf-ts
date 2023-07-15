import { getCombinedNodeFlags } from "typescript";
import { SGFGoban } from "../src/goban";
import { parseSGF, parseSGFCollection, SGFParser } from "../src/parser";
import { coordinateToRowColumn, expandCoordinatesRange, rowColumnToCoordinate, Tag } from "../src/sgf";

describe('testing index file', () => {
	test('example', () => {
		let node = parseSGF(`(;GM[1]FF[4]DT[2023-06-26 18 00 38]SZ[19]KM[6.5]RU[japanese]PB[Human (Normal Game)ㅤ​]PW[Human (Normal Game)ㅤ​]CA[UTF-8]AP[KaTrain:1.13.0]KTV[1.0]C[SGF generated by KaTrain 1.13.0ㅤ​];B[qd]C[];W[dd]C[];B[pp]C[];W[dq]C[];B[nc]C[];W[dn]C[];B[fc]C[];W[hc]C[];B[nq]C[];W[cg]C[];B[qk]C[];W[dc]C[];B[dg]C[];W[cf]C[];B[jc]C[];W[mp]C[];B[jq]C[];W[kp]C[];B[lr]C[];W[kq]C[];B[kr]C[];W[mq]C[];B[mr]C[];W[io]C[];B[di]C[];W[dk]C[];B[gd]C[];W[hd]C[];B[he]C[];W[jd]KTSID[5397074704]C[];B[kd]C[];W[ie]C[];B[ke]C[];W[hf]C[];B[ge]C[];W[ig]C[];B[gf]C[];W[gg]C[];B[fg]C[];W[gh]C[];B[fh]C[];W[fi]C[];B[ei]C[];W[ch]C[];B[fj]C[];W[gi]C[];B[ef]C[];W[ej]C[];B[eb]C[];W[db]C[];B[ci]C[];W[ck]C[];B[df]C[];W[kh]C[];B[hp]C[];W[ho]C[];B[gp]C[];W[jp]C[];B[ip]C[];W[od]C[];B[oc]C[];W[pd]C[];B[pc]C[];W[go]C[];B[fp]C[];W[eo]C[];B[ce]C[];W[de]C[];B[be]C[];W[bf]C[];B[bc]C[];W[bb]C[];B[ab]C[];W[cc]C[];B[ba]C[];W[cb]C[];B[bd]C[];W[ae]C[];B[bh]C[];W[cd]C[];B[bj]C[];W[qe]C[];B[rd]C[];W[qi]C[];B[ok]C[];W[qm]C[];B[oi]C[];W[qg]C[];B[qo]C[];W[om]C[];B[li]C[];W[np]C[];B[op]C[];W[ml]C[];B[lk]C[];W[nj]C[];B[oj]C[];W[ni]C[];B[nh]C[];W[mh]C[];B[ng]C[];W[mg]C[];B[nf]C[];W[mi]C[];B[rj]C[];W[oo]C[];B[kg]C[];W[lh]C[];B[cq]C[];W[er]C[];B[co]C[];W[cr]C[];B[bl]C[];W[bk]C[];B[ak]C[];W[oq]C[];B[nr]C[];W[qq]C[];B[pq]C[];W[cm]C[];B[bm]C[];W[ro]C[];B[rn]C[];W[rp]C[];B[qn]C[];W[pr]C[];B[or]C[];W[rr]C[];B[cn]C[];W[gr]C[];B[hr]C[];W[pl]C[];B[pk]C[];W[mf]C[];B[me]C[];W[dm]C[];B[bq]C[];W[rm]C[];B[ep]C[];W[br]C[];B[eq]C[];W[ar]C[];B[fr]C[];W[fs]C[];B[gq]C[];W[fq]C[];B[fo]C[];W[fn]C[];B[fr]C[];W[iq]C[];B[jr]C[];W[fq]C[];B[dp]C[];W[dr]C[];B[fr]C[];W[jb]C[];B[kc]C[];W[ib]C[];B[bs]C[];W[fq]C[];B[gn]C[];W[of]C[];B[ne]C[];W[fr]C[];B[fm]C[];W[en]C[];B[ek]C[];W[dj]C[];B[jo]C[];W[gm]C[];B[hn]C[];W[in]C[];B[hm]C[];W[im]C[];B[hl]C[];W[gk]C[];B[fk]C[];W[gl]C[];B[il]C[];W[jn]C[];B[gj]C[];W[hk]C[];B[hj]C[];W[ik]C[];B[jl]C[];W[jk]C[];B[kl]C[];W[fl]C[];B[el]C[];W[ij]C[];B[ih]C[];W[jh]C[];B[hi]C[];W[hg]C[];B[lq]C[];W[ko]C[];B[mn]C[];W[mo]C[];B[nn]C[];W[on]C[];B[lm]C[];W[no]C[];B[nl]C[];W[nm]C[];B[mk]C[];W[nk]C[];B[ol]C[];W[mm]C[];B[rl]C[];W[sn]C[];B[sl]C[];W[sm]C[];B[gb]C[];W[hb]C[];B[kb]C[];W[ka]C[];B[la]C[];W[ja]C[];B[mb]C[];W[jg]C[];B[ps]C[];W[qr]C[];B[aq]C[];W[lf]C[];B[jf]C[];W[if]C[];B[kf]C[];W[ac]C[];B[da]C[];W[ca]C[];B[ql]C[];W[pm]C[];B[ea]C[];W[ga]C[];B[ee]C[];W[gc]C[];B[fb]C[];W[ad]C[];B[cl]C[];W[dl]C[];B[le]C[];W[lp]C[];B[ag]C[];W[em]C[];B[hs]C[];W[dh]C[];B[eh]C[];W[qs]C[];B[os]C[];W[qp]C[];B[po]C[];W[bg]C[];B[ed]C[];W[af]C[];B[ah]C[];W[ec]C[];B[do]C[];W[ha]C[];B[fd]C[];W[fm]C[];B[cj]C[];W[id]C[];B[lg]C[];W[je]C[];B[ic]C[];W[pn]C[];B[oq]C[];W[gs]C[];B[fa]KTSF[5397074704]C[])`);
		const goban = new SGFGoban();
		while (node) {
			const removed = goban.apply(node);
			console.log(`Removed stones: ${JSON.stringify(removed)}`);
			console.log(`Node has ${node.children.length} children`);
			if (node.children.length > 0 && removed?.length > 0) {
				for (const removedCoordinates of removed) {
					let [row, column] = coordinateToRowColumn(removedCoordinates);
					console.log(`Removed ${removedCoordinates} at row ${row}, column ${column}`);
				}
			}
			node = node.children[0]
		}
		let [row, column] = [15, 15];
		const group = goban.getGroupInfo(rowColumnToCoordinate([row, column]));
		console.log(`After the last move a group containing a stone at row ${row}, column ${column} is ${group.groupColor}, contains the following stones ${JSON.stringify(group.groupStones)}`)
	});
	test('tags', () => {
	  expect(new SGFParser("").readProperty()).toBe(null);
	  expect(new SGFParser("ASD[]").readProperty().name).toBe("ASD");
	  expect(new SGFParser("ASD[]").readProperty().value).toBe("");
	  expect(new SGFParser("ASD[1]").readProperty().value).toBe("1");
	  expect(new SGFParser("ASD[12]").readProperty().value).toBe("12");
	  expect(new SGFParser("ASD[123]").readProperty().value).toBe("123");
	  expect(new SGFParser(`ASD[12\\]3]`).readProperty().value).toBe("12]3");
	  expect(new SGFParser(" ASD[]").readProperty().name).toBe("ASD");
	  expect(new SGFParser("ASD []").readProperty().value).toBe("");
	  expect(new SGFParser("ASD[1] ").readProperty().value).toBe("1");
	  expect(new SGFParser("ASD  [12]").readProperty().value).toBe("12");
	  expect(new SGFParser("ASD\n[123]").readProperty().value).toBe("123");
	  expect(new SGFParser(`ASD\t[12\\]3]`).readProperty().value).toBe("12]3");

	  expect(new SGFParser("A[B]").readProperty().name).toBe("A");
	  expect(new SGFParser("A[B]").readProperty().value).toBe("B");
	});
	test('multiple values', () => {
	  expect(new SGFParser("ASD[12]").readProperty().values.length).toBe(1);
	  expect(new SGFParser("ASD[12]").readProperty().value).toBe("12");
	  expect(new SGFParser("ASD[12][34]").readProperty().values.length).toBe(2);
	  expect(new SGFParser("ASD[12][34]").readProperty().values[0]).toBe("12");
	  expect(new SGFParser("ASD[12][34]").readProperty().values[1]).toBe("34");

	  expect(new SGFParser("ASD[12][34]X[]").readProperties().length).toBe(2);
	  expect(new SGFParser("ASD[1234]X[]").readProperties().length).toBe(2);
	});
	test('invalid tags', () => {
	  expect(() => { new SGFParser("ASD").readProperty() }).toThrow(Error);
	  expect(() => { new SGFParser("ASD ").readProperty() }).toThrow(Error);
	  expect(() => { new SGFParser("ASD]").readProperty() }).toThrow(Error);
	  expect(() => { new SGFParser("ASD[").readProperty() }).toThrow(Error);
	})
	test('parse multiple tags', () => {
		const reader = new SGFParser("A[]BB[CC]");
		const properties = reader.readProperties()
		expect(properties.length).toBe(2);
		expect(properties[0].name).toBe("A");
		expect(properties[0].value).toBe("");
		expect(properties[1].name).toBe("BB");
		expect(properties[1].value).toBe("CC");
	});
	test('simple node', () => {
		const node = new SGFParser(';GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-03]').readNode();
		expect(node.properties.length).toBe(7);
		expect(node.getProperty("CA")).toBe("UTF-8");
		expect(node.getProperty("AP")).toBe("Sabaki:0.52.2");
		expect(node.getProperty("GM")).toBe("1");
	});
	test('simple node sequence', () => {
		const node = new SGFParser(';GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-03];B[fg];W[gi];B[jg];W[hd]').readNode();
		expect(node.properties.length).toBe(7);
		expect(node.getProperty("CA")).toBe("UTF-8");
		expect(node.getProperty("AP")).toBe("Sabaki:0.52.2");
		expect(node.getProperty("GM")).toBe("1");
		expect(node.children.length).toBe(1);
		expect(node.children[0].children.length).toBe(1);
	});
	test('two branches', () => {
		const node = new SGFParser(';GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-03](;B[ij]C[abc];W[kg];B[if];W[kd])(;PL[B]AB[ef])').readNode();
		expect(node.properties.length).toBe(7);
		expect(node.getProperty("CA")).toBe("UTF-8");
		expect(node.getProperty("AP")).toBe("Sabaki:0.52.2");
		expect(node.getProperty("GM")).toBe("1");
		expect(node.children.length).toBe(2);
	});
	test('two branches with backward slash', () => {
		const node = new SGFParser(';GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-03](;B[ij]C[a[b\\]c];W[kg];B[if];W[kd])(;PL[B]AB[ef])').readNode();
		expect(node.properties.length).toBe(7);
		expect(node.getProperty("CA")).toBe("UTF-8");
		expect(node.getProperty("AP")).toBe("Sabaki:0.52.2");
		expect(node.getProperty("GM")).toBe("1");
		expect(node.children.length).toBe(2);
		expect(node.toSGF()).toBe("(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-03](;B[ij]C[a[b\\]c];W[kg];B[if];W[kd])(;PL[B]AB[ef]))");
	});
	test('tree with putting stones', () => {
		const node = parseSGF('(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-04]AB[bb][cb][db]AW[bc][cc][dc])');
		const goban = new SGFGoban(node);
		console.log(goban.debugStr());
		expect(goban.debugStr()).toBe(`
.............
.BBB.........
.WWW.........
.............
.............
.............
.............
.............
.............
.............
.............
.............
.............`.trim());
		expect(node.toSGF()).toBe("(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[13]DT[2022-12-04]AB[bb][cb][db]AW[bc][cc][dc])");
	})
	test('multiline', () => {
		const root = parseSGF(`(;
			AW[bc]
			AW[dc]
			AB[lc]
			LB[lc:+]
			AW[nc]
			AW[pc]
			AW[qc]
			AB[bd]
			AW[cd]
			AW[fd]
			AB[hd]
			AB[pd]
			AB[ce]
			AB[ee]
			AW[fe]
			AB[qe]
			AW[gf]
			AB[of]
			AB[pf]
			AW[qf]
			AB[rf]
			AB[eg]
			AW[pg]
			AW[dh]
			AB[eh]
			AB[di]
			AB[pi]
			AW[dj]
			AW[dp]
			AW[jp]
			AB[qp]
			AB[oq]
			PL[W]
			;
			W[md]
			)`);
		expect(root?.children.length).toBe(1);
		expect(root?.children[0].children.length).toBe(0);
		expect(root?.children[0].getProperty(Tag.White)).toBe("md");
	});
	test('collection', () => {
		const sgfs = parseSGFCollection(`
		(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[9]DT[2023-06-26]GN[aaa]RE[bbb];B[db];W[ec];B[ff])
		
(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[9]DT[2023-06-26]GN[ccc]RE[ddd];B[db];W[ec];B[ff])

(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.52.2]KM[6.5]SZ[9]DT[2023-06-26]GN[eee]RE[fff];B[db];W[ec];B[ff])


	`);
		expect(sgfs.length).toBe(3);
		expect(sgfs[0].getProperty(Tag.GameName)).toBe("aaa");
		expect(sgfs[1].getProperty(Tag.GameName)).toBe("ccc");
		expect(sgfs[2].getProperty(Tag.GameName)).toBe("eee");
	});
	test('expand range', () => {
		expect(expandCoordinatesRange("dd:de")).toEqual(["dd", "de"]);
		expect(expandCoordinatesRange("dd:df")).toEqual(["dd", "de", "df"]);
		expect(expandCoordinatesRange("dd:ee")).toEqual(["dd", "ed", "de", "ee"]);
		expect(expandCoordinatesRange(["dd:ee", "aa"])).toEqual(["dd", "ed", "de", "ee", "aa"]);
	});
	// test('goban add white and black', () => {
	// 	const goban = new Goban();
	// })
  });