from flask import Flask, render_template, g, request
from flask_sockets import Sockets
import gevent

import redis


app = Flask(__name__)
sockets = Sockets(app)


#app.debug = True
#app.reload = True



@app.route('/game/<channel>')
def groupgame(channel):
	resp = render_template('snake.html')
	return resp

	



@app.route('/')
@app.route('/snake')
def snake():
	resp = render_template('snake.html')
	return resp


def incoming_snake_update(channel, r, ws):
	client = r.pubsub()
	client.subscribe(channel)
	# client.listen is a blocking call
	for msg in client.listen():
		# new subscriptions get announced, ignore them for now
		if msg['type'] == 'subscribe':
			continue
		# push the data back over our websocket connection to client
		ws.send(msg['data'])


def outgoing_snake_update(channel, r, ws):
	# ws.receive is a blocking call that will return as soon as it gets something
	message = ws.receive()
	if message is None:
		return
	r.publish(channel, message)
	gevent.spawn(outgoing_snake_update, r, ws)


@sockets.route('/snakesocket')
def snakesocket(ws):
	r = redis.StrictRedis(host="localhost", port=6379, db=0)

	gevent.joinall([
		gevent.spawn(incoming_snake_update, channel, r, ws),
		gevent.spawn(outgoing_snake_update, channel, r, ws)
		])


if __name__ == "__main__":
	app.run()

