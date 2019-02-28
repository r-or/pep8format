#!/usr/bin/env python3
import sys
import os
import json
import time
import traceback
import pprint

# external modules
import autopep8
from redis import Redis, RedisError

while True:
    try:
        redis = Redis(host='redis', port=6379)
        break
    except RedisError:
        print('Cannot reach redis. Retry...')
        time.sleep(.5)
        continue
try:
    print('Waiting for pep8 jobs...')
    while (True):
        try:
            job = json.loads(redis.brpop('pep8jobs')[1])
        except RedisError:
            print('Cannot reach redis. Retry...')
            time.sleep(.5)
            continue
        print('Working on job #{}'.format(job['id']))
        try:
            # list of code lines:
            lines = job.pop('lines', None).replace('\r', '').split('\n')
            options = autopep8.parse_args([''])
            # set of selected errors/warnings:
            options.select = {k for k in job.pop('select', None)}
            job['result'] = autopep8.fix_lines(lines, options)
        except:
            traceback.print_exc()
            print('Job #{} got canceled!'.format(job['id']))
            job['result'] = 'ERROR: canceled job'
        finally:
            redis.publish('pep8result#{}'.format(job['id']), json.dumps(job))

except KeyboardInterrupt:
    pass
