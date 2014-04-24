#Protok.js

A node.js module to easily make all kinds of protocols.

For mobile application
Server to server communication
File transfering

Synchronous and asynchronous modes

Flexible

Utilizes node.js streams

Control mechanizms to prevent server overloading

Abuse prevention



Protok.js splits all incoming traffic by separator string(default is '\r\n')


Protok.js has two main operation modes:
- Synchronous
- Asynchronous


## Synchronous
In synchronous mode every data thunk is processed sequently one after another every time blocking the flow.
Synchronous is useful when sequence and consistency matters. For example if we are writing some file management protocol like FTP, and let's imagine we want to send two commands: "mkdir test", "rmdir test". For this case it's very important for the protocol to be synchronous besause otherwise if both commands would be executed at the same time, you can't be sure if the directory was firstly created and secondly deleted or it was deleted(unexisted) and then created.
Another use case for asynchronous protocol would be


## Asynchronous
Real time
In asynchronous mode every thunk of data is parsed and processed as soon as data is got. Though there are some flow stoping mechanisms to limit how many executes commands could be depending on server load.

