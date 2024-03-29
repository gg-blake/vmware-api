# vmware-api

Requirements:
1. Node
2. PuTTy
3. VMWare Workstation Pro

## PART 1: VMWare API Server Configuration
1. Make sure VMWare Workstation is added to path (i.e. `$env:Path += ";C:\Program Files (x86)\VMware\VMware Workstation\"`)

2. In any directory, create a directory called `certs`.
```
mkdir certs
cd certs
```
4. In a different environment, preferrably linux & WSL, create then navigate to a folder also called "certs", and generate a new certificate and key:

```openssl req -x509 -sha256 -nodes -newkey rsa:4096 -keyout vmaware-key.pem -out vmware-crt.pem -days 365```

4. Using WSL, open the location of your cert and key by typing `explorer.exe .`, then copy the contents of the certs folder over to the certs folder of the windows computer.

5. You will not need WSL for the rest of the setup. Navigate to the certs folder. Then issue the command `vmrest -C` and create a secure username and password.

6. Start the VMWare API locally with the following command:

```vmrest -c .\vmware-crt.pem -k .\vmware-key.pem```

7. Once the server is live, you can access the api in the browser from https://localhost:8697 or https://<loopback ip address>:8697

## PART 2: VMWare TutorVServer Configuration
8. In a command prompt type `ipconfig /all` and note the preferred ip address of "Ethernet adapter VMware Network Adapter VMnet1".

9. Launch VMWare, then start the TutorVServer. Edit a new file called `update.sh` in the  user directory. Save the following text into the bash script:
```bash
#!/bin/bash

remote_password="<umb unix server password>"
remote_user="<umb unix server username>"
remote_host="users.cs.umb.edu"
remote_file="<the filename of the file you want to track>"
remote_path="<the path of the file you want to track (i.e. 'cs341/mp2/part2+3/')>${remote_file}"

scp "${remote_user}@${remote_host}:${remote_path}" .

curl http://<ip address from step 8>:3000/restart-tutor

mtip -f "${remote_file}"
```
10. Make sure you make update.sh executable with the command "chmod +x update.sh"

## PART 3: Certificate Generation
11. SSH into your umb unix server account and create a .ssh folder in your user's home folder and cd into it then generate an rsa key with the following command:

`ssh-keygen -t rsa -b 4096`

12. In your tutorvserver, navigate to your home directory and issue the following command to copy the linux server's rsa credentials:

ssh-copy-id <user>@users.cs.umb.edu

## PART 4: Node Server Configuration
13. Go to the vmware api and copy the curl request (GET /vms) under the section "VM Management".

i.e.`curl 'https://127.0.0.1:8697/api/vms' -X GET --header 'Accept: application/vnd.vmware.vmw.rest-v1+json' --header 'Authorization: Basic <your encrypted credentials>'`

14. When you enter this into your command prompt or click "try it out" under the endpoint  on the api site, you should receive a json that looks like this:
```JSON
[
  {
    "id": "I6PUP82K64OC1U6LP5SIBDFL04A35MK7",
    "path": "C:\\Users\\Blake\\Documents\\Virtual Machines\\TutorVServer\\TutorVServer.vmx"
  },
  {
    "id": "3BLLN5HVLJEU3QUNOJMEMB30MHC28CFL",
    "path": "C:\\Users\\Blake\\Documents\\Virtual Machines\\Tutor\\Tutor.vmx"
  }
]
```
15. Note the corresponding id of the `Tutor.vmx`. In the git repo local directory, edit the template `.env` file with your virtual machine's login credentials and the id noted.

16. Over on your local computer, in a new command window, navigate to the contents of the git repo and start the node server. You should see `Listening on port 3000` in the console output.
```
cd <path of repo>
node app.js
```
17. Once both the VMWare API server and the Node servers are running, you should be able to restart your tutor vm remotely by going to `https://localhost:3000/ssh` in the web browser. Confirm this before proceeding with the steps.

## PART 5: UMB Unix Server Configuration

18. In a command prompt window, create a temporary localhost tunnel by issuing the following command and noting the outputted url

**NOTE: I plan on making a server that periodically refreshes the url and uploads it to the umb cs unix server but for now you will have to issue this command manually periodically.**

```ssh -R 80:localhost:3000 nokey@localhost.run```

19. Go to the UMB CS Unix server. Name a bash script called `upload.sh` and enter the following text into its contents:
```bash
#!/bin/bash

make A=$1
curl <tunnelled localhost url>/ssh
```
20. Make upload.sh executable with "chmod +x upload.sh"

### 21. By issuing the command `./upload.sh <filename without extension>` your assembly code will be assembled, sent to vserver and a ssh window will open with a tutor session of the newly compiled .lnx file! With this script, you should (in theory XD) never have to switch to VMWare!
