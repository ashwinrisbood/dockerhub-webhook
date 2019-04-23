express = require("express");
const Client = require('kubernetes-client').Client
const path = '/etc/kubernetes/admin.conf'
const config = require('kubernetes-client').config
var app=express();

const deploymentManifest = require('./bluegreen.json')

async function applyDeploy () {
  const client = new Client({ config: config.fromKubeconfig(), version: '1.9' })

  try {
    const create = await client.apis.apps.v1.namespaces('default').deployments.post({ body: deploymentManifest })
    console.log('Create:', create)
  } catch (err) {
    if (err.code !== 409) throw err
    await client.apis.apps.v1.namespaces('default').deployments(deploymentManifest.metadata.name).delete()
    const replace = await client.apis.apps.v1.namespaces('default').deployments.post({ body: deploymentManifest }) 
    console.log('Replace:', replace)
  }
}

app.post("/hook", (req, res, next) => {
    const webhookUrl = req.params.url;
    console.log("hit")
    applyDeploy() 
    res.status(200).send('OK')
});
app.listen(5500,'0.0.0.0',function(){
	console.log("Server running on 5500");
})

module.exports = app;
