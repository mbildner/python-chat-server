from random import choice

def get_random_id(length):
	rand_char_string = '0123456789abcdefghijklmnopqrstuvwxyz'
	userid = "".join([choice(rand_char_string) for x in range(length)])
	return userid



