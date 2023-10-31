

all: ext
	@echo "Extension built, you should be able to install it using EspoCRM extension installer"

ext:
	bash ./buildext

clean:
	bash ./build-scripts.sh cleanup

install:
	bash ./build-scripts.sh install

uninstall:
	bash ./build-scripts.sh uninstall


	
