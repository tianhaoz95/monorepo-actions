FROM python:3.8-alpine3.11

WORKDIR /action

COPY . .

RUN pip install -r requirements.txt

RUN ls /action

ENTRYPOINT ["python", "/action/cli.py"]
