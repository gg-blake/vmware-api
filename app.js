const express = require('express');
const fetch = require('node-fetch');
const child_process = require('child_process');
require('dotenv').config({path: "./.env"});
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'

const app = express ();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});

app.get('/setup', (request, response) => {
    const options ={
        method: 'GET',
        headers: {
            'Content-Type': 'application/vnd.vmware.vmw.rest-v1+json',
            'Accept': 'application/vnd.vmware.vmw.rest-v1+json',
            'Authorization': `Basic ${process.env.VMWARE_auth}`
        },
    };

    var ssh = new Promise((resolve, reject) => {
        try {
            var child = child_process.spawnSync(`start cmd.exe /K plink -batch ${process.env.SSH_host} -l ${process.env.SSH_user} -pw ${process.env.SSH_password} ./update.sh`);
            resolve();
        } catch (error) {
            reject(error);
        }
    })

    ssh.then(() => fetch("http://127.0.0.1:8697/api/vms", options))
    .then((res) => res.json())
    .then((json) => new Promise((resolve, reject) => {
        var tutor_id = json[1].id;

        const put_options = {
            'method': 'PUT',
            'headers': {
                'Content-Type': 'application/vnd.vmware.vmw.rest-v1+json',
                'Accept': 'application/vnd.vmware.vmw.rest-v1+json',
                'Authorization': `Basic ${process.env.VMWARE_auth}`
            },
            body: "shutdown"
          
        };

        const shutdown = fetch(`http://127.0.0.1:8697/api/vms/${tutor_id}/power`, put_options)
        .then((res) => res.json());

        put_options.body = "on";
        
        const startup = shutdown.then((json) => fetch(`http://127.0.0.1:8697/api/vms/${tutor_id}/power`, put_options)).then((res) => res.json())
        .then((json) => resolve(json))
        .catch((error) => reject(error))
    }))
    .then((json) => {
        console.log("Tutor Restarted");
        response.status(200).send({
            "status": 200,
            "message": "Tutor Restarted"
        });
    })
    .then(() => {
        child.stdin.write("\n");
    })
    .catch((error) => {
        console.log("[ERROR]: ", error);
        response.status(503).send({
            "status": 503,
            "message": "Service Unavailable"
        });
    });
});



app.get('/ssh', async (request, response) => {
    // If you get a permission denied error, you need to go to the vserver and type "ssh-copy-id bmoody25@users.cs.umb.edu" and enter your password
    child_process.execSync(`start cmd.exe /K plink ${process.env.SSH_host} -l ${process.env.SSH_user} -pw ${process.env.SSH_password} ./update.sh`);
    response.status(200).send({
        "status": 200,
        "message": "SSH Connection Started"
    });
})