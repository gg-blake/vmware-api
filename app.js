const express = require('express');
const request = require('request');
const child_process = require('child_process');
require('dotenv').config({path: "./.env"});
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'

const app = express ();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});

async function changeTutorState(options) {
    request(options, function (error, response) {
        if (error) {
            console.log(options);
            throw new Error(error);
            return {
                "status": 503,
                "message": "Service Unavailable",
                "body": response
            }
        }
    })
    return {
        "status": 200,
        "message": "Tutor Shutdown"
    }
} 

async function restartTutor() {
    var options = {
        'method': 'PUT',
        'url': `https://127.0.0.1:8697/api/vms/${process.env.VMWARE_tutor_id}/power`,
        'headers': {
            'Content-Type': 'application/vnd.vmware.vmw.rest-v1+json',
            'Accept': 'application/vnd.vmware.vmw.rest-v1+json',
            'Authorization': `Basic ${process.env.VMWARE_auth}`
        },
        body: JSON.stringify({
            "operation": "on"
        })
      
    };
    var shutdownResponse = await changeTutorState(options);
    options.body = "on";
    var startupResponse = await changeTutorState(options);
    return {
        shutdownResponse,
        startupResponse
    }
}

app.get('/restart-tutor', async (request, response) => {
    var { shutdownResponse, startupResponse } = await restartTutor();

    if (shutdownResponse.status !== 200 || startupResponse.status !== 200) {
        response.status(503).send({
            "status": 503,
            "message": "Service Unavailable"
        });
        return;
    }
    response.status(200).send({
        "status": 200,
        "message": "Tutor Restarted"
    });
})

app.get('/ssh', async (request, response) => {
    // If you get a permission denied error, you need to go to the vserver and type "ssh-copy-id bmoody25@users.cs.umb.edu" and enter your password
    child_process.execSync(`start cmd.exe /K plink ${process.env.SSH_host} -l ${process.env.SSH_user} -pw ${process.env.SSH_password} ./update.sh`);
    response.status(200).send({
        "status": 200,
        "message": "SSH Connection Started"
    });
})