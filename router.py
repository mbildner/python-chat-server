from flask import Flask, render_template, g
from flask_sockets import Sockets
import gevent

import redis



app = Flask(__name__)
sockets = Sockets(app)


#app.debug = True
#app.reload = True

def redis_to_ws(r, ws):
	client = r.pubsub()
	client.subscribe("msg_channel")
	for msg in client.listen():
		if msg['type'] == 'subscribe':
			continue
		ws.send(msg['data'])

def ws_to_redis(r, ws):
	message = ws.receive()
	if message is None:
		return
	r.publish("msg_channel", message)
	gevent.spawn(ws_to_redis, r, ws)



@app.route('/test')
def test():
	return "working"

@app.route('/')
def home():
	resp = render_template('index.html')
	return resp


@app.route('/snake')
def demo():
	resp = render_template('snake.html')
	return resp



def incoming_snake_update(r, ws):
	client = r.pubsub()
	client.subscribe("snake_update")
	# client.listen is a blocking call
	for msg in client.listen():
		# new subscriptions get announced, ignore them for now
		if msg['type'] == 'subscribe':
			continue
		# push the data back over our websocket connection to client
		ws.send(msg['data'])


def outgoing_snake_update(r, ws):
	# ws.receive is a blocking call that will return as soon as it gets something
	message = ws.receive()
	if message is None:
		return
	r.publish("snake_update", message)
	gevent.spawn(outgoing_snake_update, r, ws)


@sockets.route('/snakesocket')
def snakesocket(ws):
	r = redis.StrictRedis(host="localhost", port=6379, db=0)

	gevent.joinall([
		gevent.spawn(incoming_snake_update, r, ws),
		gevent.spawn(outgoing_snake_update, r, ws)
		])


@sockets.route('/chatsocket')
def chatsocket(ws):
	r = redis.StrictRedis(host="localhost", port=6379, db=0)
	gevent.joinall([
		gevent.spawn(ws_to_redis, r, ws),
		gevent.spawn(redis_to_ws, r, ws)
	])

if __name__ == "__main__":
	app.run()

