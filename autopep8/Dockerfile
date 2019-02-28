FROM python:3.7-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN pip3 install --trusted-host pypi.python.org -r requirements.txt
EXPOSE 6379
CMD ["python3", "autopep8daemon.py"]
