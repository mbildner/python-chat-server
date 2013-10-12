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
	r.publish("msg_channel", message)
	gevent.spawn(ws_to_redis, r, ws)

@app.route('/')
def home():
	resp = render_template('index.html')
	return resp


@sockets.route('/chatsocket')
def chatsocket(ws):
	r = redis.StrictRedis(host="localhost", port=6379, db=0)
	gevent.joinall([
		gevent.spawn(ws_to_redis, r, ws),
		gevent.spawn(redis_to_ws, r, ws)
	])

if __name__ == "__main__":
	app.run()

