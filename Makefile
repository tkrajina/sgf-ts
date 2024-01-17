.PHONY: test
test:
	./node_modules/.bin/jest

.PHONY: clean
clean:
	-rm all.*

.PHONY: single-js
single-js: clean
	echo "A VERY STUPID WAY TO CREATE A BROWSER-FRIENDLY SINGLE JS FILE (BUT IT WORKS)"

	echo "" > all.ts
	cat src/sgf.ts | grep -v -E "import.*from" >> all.ts
	cat src/parser.ts | grep -v -E "import.*from" >> all.ts
	cat src/goban.ts | grep -v -E "import.*from" >> all.ts
	cat src/anki_goban_viewer.ts | grep -v -E "import.*from" >> all.ts
	cat src/goban_viewer.ts | grep -v -E "import.*from" >> all.ts

	tsc all.ts

	open goban.html

