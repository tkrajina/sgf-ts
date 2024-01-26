.PHONY: test
test: compile
	./node_modules/.bin/jest

.PHONY: compile
compile:
	#./node_modules/.bin/tsc

.PHONY: single-test
single-test:
	if [ -z "$(TEST)" ]; \
	then \
		echo "no APP specified => $(TEST)"; \
		exit 1; \
	fi
	./node_modules/.bin/jest -t '$(TEST)'

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
	mv all.js pages
	open pages/problem.html
	rm all.ts

