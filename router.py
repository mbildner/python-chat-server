from flask import Flask, render_template, g, before_requests
from flask_sockets import Sockets

import redis



app = Flask(__name__)
sockets = Sockets(app)


app.debug = True
app.reload = True

@before_requests
def before():
	g.r = redis.StrictRedis(host="localhost", port=6379, db=0)


@app.route('/')
def home():
	resp = render_template('index.html')
	return resp


@sockets.route('/chatsocket')
def chatsocket(ws):
	while True:
		message = ws.receive()
		g.r.rpush('messages', str(message))

		messages = g.r.lrange('messages', 0, -1)
		for message in messages:
			ws.send(message)

if __name__ == "__main__":
	app.run()

