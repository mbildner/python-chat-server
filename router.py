# switch to more bare-bones handler for websocket suppport
# good demo found here: https://gist.github.com/lrvick/1185629
# flask_sockets is good, just not there yet

from flask import Flask, render_template, g, request, session
from flask_sockets import Sockets
import gevent
import redis


from helper import get_random_id



app = Flask(__name__)
sockets = Sockets(app)


app.debug = True
#app.reload = True


app.secret_key = "moshe's super secret key"


r = redis.Redis(host="localhost", port=8000, db=0)


@app.route('/')
@app.route('/home')
def home():
	userid = get_random_id(20)
	session['userid'] = userid
	resp = render_template('home.html')
	return resp




@sockets.route('/' + userid)
def snakesocket(ws):
	print "connection to " + username
	return session['userid']

	while True:
		messages = ws.listen()

		for message in messages:
			print message
			ws.send(message)

	# if message is None:
	# 	break










# def outgoing_snake_update(r, ws):
# 	# ws.receive is a blocking call that will return as soon as it gets something
# 	message = ws.receive()
# 	if message is None:
# 		return
# 	r.publish("snake_update", message)
# 	gevent.spawn(outgoing_snake_update, r, ws)

# def incoming_snake_update(r, ws):
# 	client = r.pubsub()
# 	client.subscribe("snake_update")
# 	# client.listen is a blocking call
# 	for msg in client.listen():
# 		# new subscriptions get announced, ignore them for now
# 		if msg['type'] == 'subscribe':
# 			continue
# 		# push the data back over our websocket connection to client
# 		ws.send(msg['data'])


# @sockets.route('/signalsocket')
# def snakesocket(ws):
# 	r = redis.StrictRedis(host="localhost", port=6379, db=0)

# 	gevent.joinall([
# 		gevent.spawn(incoming_snake_update, r, ws),
# 		gevent.spawn(outgoing_snake_update, r, ws)
# 		])


if __name__ == "__main__":
	app.run()

