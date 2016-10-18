NAME=domoticz-plex
REPO=gluffs/$(NAME)
REPO_URL=registry.gluffs.eu:5000

.PHONY: admin bash start build

all: build

build:
	docker build -t $(REPO) --no-cache=true .

push:
	docker tag -f $(REPO) $(REPO_URL)/$(REPO)
	docker push $(REPO_URL)/$(REPO)

restart: stop rm start

start:
	docker run -d --restart=always --log-driver=json-file --log-opt max-size=10m --log-opt max-file=10 -e "PLEX_HOST=$(PLEX_HOST)" -e "PLEX_PORT=$(PLEX_PORT)" -e "DOMOTICZ_HOST=$(DOMOTICZ_HOST)" -e "DOMOTICZ_PORT=$(DOMOTICZ_PORT)" -e "DOMOTICZ_URL=$(DOMOTICZ_URL)" -e "DOMOTICZ_IDX=$(DOMOTICZ_IDX)" -e "DOMOTICZ_VAR=$(DOMOTICZ_VAR)" --name $(NAME) $(REPO_URL)/$(REPO)

stop:
	docker stop $(NAME) || echo "Nothing to stop"

rm:
	docker rm -f $(NAME) || echo "Nothing to remove"

bash: CMD = bash
bash: build run

run:
	docker run -t -i -e "PLEX_HOST=$(PLEX_HOST)" -e "PLEX_PORT=$(PLEX_PORT)" -e "DOMOTICZ_HOST=$(DOMOTICZ_HOST)" -e "DOMOTICZ_PORT=$(DOMOTICZ_PORT)" -e "DOMOTICZ_URL=$(DOMOTICZ_URL)" -e "DOMOTICZ_IDX=$(DOMOTICZ_IDX)" -e "DOMOTICZ_VAR=$(DOMOTICZ_VAR)" --rm --name $(NAME) $(REPO) $(CMD)
