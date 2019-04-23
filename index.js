express = require("express");
const Client = require('kubernetes-client').Client
const path = '/etc/kubernetes/admin.conf'
const config = require('kubernetes-client').config
var app=express();

const blue = require('./blue.json')
const green = require('./green.json')

async function applyDeploy () {
  const client = new Client({ config: config.fromKubeconfig(path), version: '1.9' })

  try {
    const create_blue = await client.apis.apps.v1.namespaces('default').deployments.post({ body: blue })
    const create_green = await client.apis.apps.v1.namespace('default').deployments.post({body: green})
    console.log('Create:', create_blue, create_green)
  } catch (err) {
    if (err.code !== 409) throw err
    await client.apis.apps.v1.namespaces('default').deployments(blue.metadata.name).delete()
    await client.apis.apps.v1.namespaces('default').deployments(green.metadata.name).delete()
    const replace_blue = await client.apis.apps.v1.namespaces('default').deployments.post({ body: blue })
    const replace_green = await client.apis.apps.v1.namespace('default').deployments.post({body: green}) 
    console.log('Replace:', replace_blue, replace_green)
  }
}

app.post("/hook", (req, res, next) => {
    const webhookUrl = req.params;
    console.log("hit")
    applyDeploy() 
    res.status(200).send('OK')
});
app.listen(5500,'0.0.0.0',function(){
	console.log("Server running on 5500");
})

module.exports = app;
