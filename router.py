from flask import Flask, render_template
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
	while True:
		message = ws.receive()

		with open('chatdb.txt', 'a') as db:
			entry = message + '\n'
			db.write(entry)

		with open('chatdb.txt', 'r') as db:
			reply = ''.join([line for line in db])

		ws.send(reply)


if __name__ == "__main__":
	app.run(port=8181)

