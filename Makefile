all:
	@npm run browserify
	@npm run uglify

clean:
	@npm run clean

docs:
	@npm run docs

test:
	@npm test

.PHONY: all clean docs test
