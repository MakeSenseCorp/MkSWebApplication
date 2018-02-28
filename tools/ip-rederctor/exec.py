import os
import urllib2
import re
import time

def check_in():
	try:
		fqn = os.uname()[1]
		ext_ip = urllib2.urlopen('http://whatismyip.org/homepage/').read()
		ip = re.findall( r'[0-9]+(?:\.[0-9]+){3}', ext_ip )
		print (time.ctime() + " - Asset: %s " % fqn, "Checking in from IP#: %s " % ip[0])
		data = urllib2.urlopen('http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8282/set/wan/ip/' + ip[0]).read()
	except:
		print "ERROR"

while (True):
	check_in()
	time.sleep(30 * 60)
