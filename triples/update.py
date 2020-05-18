#!/usr/bin/python2.6
import cgi
import os
import sqlite3
import urllib
import json
try:
    from rechte import rights
except ImportError:
    rights = None
import datetime

print "Content-type: text/plain; charset=utf-8"
print

# get the args of the url, convert nasty field storage to plain dictionary,
# there is probably a better solution, but this works for the moment
tmp_args = cgi.FieldStorage(environ={'REQUEST_METHOD': 'POST'})
args = {}
for arg in tmp_args:
    args[arg] = tmp_args[arg].value

# check whether value was submitted to arguments, otherwise insert empty one
if 'VAL' not in args: args['VAL'] = ''

# check for dbase arg and switch the database in case an argument is provided
if 'remote_dbase' in args:
    dbpath = args['remote_dbase']+'.sqlite3' if not \
            args['remote_dbase'].endswith('sqlite3') else \
            args['remote_dbase']
else:
    dbpath = 'triples.sqlite3'

# connect to db
db = sqlite3.connect(dbpath)
cursor = db.cursor()

# get datetime
now = str(datetime.datetime.now()).split('.')[0]

# check for remote user
if 'REMOTE_USER' in os.environ:
    user = os.environ['REMOTE_USER']
else:
    user = 'unknown'

# check whether user has the permissions
if rights and args['file'] in rights[user]:
    pass
elif rights is None:
    pass
else:
    print 'ERROR: User does not have the permission to modify the data!'
    raise 

# go for update
if 'update' in args:

    # allow for multiple posting of values separated by a "'"
    idxs = args['ID'].split('|')
    cols = args['COL'].split('|')
    vals = args['VAL'].split('|') # be careful with this splitter!

    # iterate over the entries
    if len(idxs) == len(cols) == len(vals):
        pass
    else:
        print 'ERROR: wrong values submitted'
        raise

    # start iteration
    for idx,col,val in zip(idxs,cols,vals):
        
        # unquote the value
        val = urllib.unquote(val)

        # check for quote characters
        if '"' in val:
            val = val.replace('"','""')

        # get original data value
        try:
            orig_val = [x for x in cursor.execute(
                'select VAL from ' + args['file'] + ' where ID=' +\
                        idx + ' and COL like "'+col+'";')][0][0]
            
            qstring = 'update '+args['file'] + ' set VAL="'+val+'" where ID='+idx+' and COL="'+col+'";'
            cursor.execute(
                    qstring
                    )

            message = 'UPDATE: Modification successful replace "{0}" with "{1}" on {2}.'.format(
                    orig_val.encode('utf-8'),
                    val,
                    now)
                    
        except IndexError:
            orig_val = '!newvalue!'
            
            # create new datum if value has not been retrieved
            cursor.execute(
                    'insert into '+args['file'] + ' values(' +\
                            idx + ',"' + col + '","' +\
                            val + '");')
            message = 'INSERTION: Successfully inserted {0} on {1}'.format(
                    val, now)
            
        # modify original value with double quotes for safety
        if '"' in orig_val:
            orig_val = orig_val.replace('"','""')

        # insert the backup line
        try:
            cursor.execute(
                'insert into backup values(?,?,?,?,strftime("%s","now"),?);',
                (
                    args['file'],
                    idx,
                    col,
                    orig_val,
                    user
                    ))
        except Exception as e:
            print e
            message = 'ERROR'

    db.commit()
    print message


elif 'delete' in args:
    lines = [line for line in cursor.execute(
        'select * from '+args['file'] +' where ID='+args['ID']+';'
        )]
    for idx,col,val in lines:
        cursor.execute(
                'insert into backup values(?,?,?,?,strftime("%s","now"),?);',
                (args['file'],idx, col, val, user))
        cursor.execute(
                'delete from '+args['file'] + ' where ID='+args['ID']+';')
    db.commit()
    print 'DELETION: Successfully deleted all entries for ID {0} on {1}.'.format(
            args['ID'],
            now)

else:
    print "nothing specified by user {0}".format(user)

db.close()
