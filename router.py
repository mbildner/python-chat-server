from flask import Flask, render_template, g
from flask_sockets import Sockets

import redis



app = Flask(__name__)
sockets = Sockets(app)


app.debug = True
app.reload = True


@app.route('/')
def home():
	resp = render_template('index.html')
	return resp


@sockets.route('/chatsocket')
def chatsocket(ws):
	r = redis.StrictRedis(host="localhost", port=6379, db=0)
	while True:
		message = ws.receive()
		r.rpush('messages', str(message))

		messages = r.lrange('messages', 0, -1)
		for message in messages:
			ws.send(message)

if __name__ == "__main__":
	app.run()

