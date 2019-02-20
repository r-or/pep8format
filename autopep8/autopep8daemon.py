#!/usr/bin/env python3
import sys
import os
import json

import autopep8
from redis import Redis, RedisError


redis = Redis()

try:
    options = autopep8.parse_args([''])
    print('Waiting for pep8 jobs...')
    while (True):
        job = json.loads(redis.brpop('pep8jobs')[1])
        print('Working on job #{}'.format(job['id']))
        lines = job.pop('lines', None).replace('\r', '').split('\n')
        job['result'] = autopep8.fix_lines(lines, options)
        print(' result: ' + job['result'])
        redis.publish('pep8result#{}'.format(job['id']), json.dumps(job))
except KeyboardInterrupt:
    pass
