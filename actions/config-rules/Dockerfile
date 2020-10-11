FROM python:3.8-alpine3.11

WORKDIR /action

COPY . .

RUN pip install requirements.txt

ENTRYPOINT ["/action/entrypoint.sh"]
