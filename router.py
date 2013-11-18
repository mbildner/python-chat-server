from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer
from flask import Flask, request, render_template, session, g
import json
from helper import get_random_id

import random

app = Flask(__name__)
app.restart = True
app.debug = True


app.secret_key = "moshebildner"



# use redis channels instead of this, but still should be doable
# with dynamic ws routing.

ws_targets = dict()



@app.route('/')
def home():

	userid = get_random_id(10)
	session["userid"] = userid
	g.userid = userid;
	# resp = render_template('home.html')
	resp = render_template('home.html')
	return resp

# @app.route('/login', methods=["POST"])
# def login():
# 	username = request.form.get("username")



@app.route('/websocket/<target>')
def chatsocket(target):
	websocket = request.environ.get("wsgi.websocket", None)

	if websocket:
		userid = session['userid']
		ws_targets[userid] = websocket

		for ws in ws_targets.values():
			ws.send(json.dumps({
				"serverorders": "newusers",
				"newusers" : ws_targets.keys()
				}))

		while True:
			message = json.loads(websocket.receive())
			target = message.get('target', 'all')
			if target == 'all':
				for ws in ws_targets.values():
					ws.send(json.dumps(message))
			else:
				target = ws_targets[target]
				target.send(json.dumps(message))


	return "end of websocket block reached without returning a websocket"





if __name__ == "__main__":
	http_server = WSGIServer(('', 8000), app, handler_class=WebSocketHandler)
	http_server.serve_forever()

