"use strict";console.log("SW: Started");var requestUrl="";fetch("./ezpush.json").then(function(response){response.json().then(function(data){console.log("SW read ezpush.json and got requestUrl."),requestUrl=data.requestUrl||""})}).catch(function(error){console.error("Unable to get ezpush.json"+error.message)}),self.addEventListener("push",function(event){console.log("SW: Received push");var contextId,subscriptionId,sessionId,notification={title:"Yay a message.",options:{body:"You have received a push message.",icon:"./images/icon-256x256.png",url:"./"}};if(event.data){try{var data=event.data.json();notification.title=data.title||notification.title,notification.options.body=data.body||notification.options.body,notification.options.icon=data.icon||notification.options.icon,notification.options.url=data.url||notification.options.url}catch(e){notification.options.body=event.data.text()}console.log("SW: Payload data is",event.data.text()||"empty"),event.waitUntil(self.registration.showNotification(notification.title,notification.options))}else event.waitUntil(self.registration.pushManager.getSubscription().then(function(subscription){console.log("SW: got subscription id"),subscriptionId=subscription.endpoint.split("/"),subscriptionId=subscriptionId[subscriptionId.length-1],console.log("SW: got a push message"),notification.messages=[],fetch(requestUrl,{method:"post",body:JSON.stringify({qualifier:"pt.openapi.context/createContextRequest",data:{properties:null}})}).then(function(response){console.log("SW: created context"),response.json().then(function(data){sessionId=response.headers.get("SessionId"),contextId=data.data.contextId,fetch(requestUrl+"?SessionId="+sessionId,{method:"post",headers:JSON.stringify({"Content-Type":"application/json"}),body:JSON.stringify({qualifier:"pt.openapi.push/getChromeNotifications",contextId:contextId,data:{subscriberId:subscriptionId}})}).then(function(responce){console.log("SW got server response."),responce.json().then(function(data){return data=data.data,data.chromeNotifications&&data.chromeNotifications.length?(console.log("SW got "+data.chromeNotifications.length+" notification(s)."),void data.chromeNotifications.forEach(function(push){notification.messages.push({id:push._id&&push._id.notificationId,applicationId:push._id&&push._id.applicationId,sessionId:sessionId,contextId:contextId,subscriptionId:subscriptionId,title:push.chromeTitle,message:push.message,icon:push.chromeIcon,url:push.url})})):void console.log("SW got 0 notifications.")}).then(function(){for(var promises=[],i=0;notification.messages&&i<notification.messages.length;i++)promises.push(self.registration.showNotification(notification.messages[i].title||notification.title,{body:notification.messages[i].message||notification.options.body,icon:notification.messages[i].icon||notification.options.icon,data:{notificationId:notification.messages[i].id,applicationId:notification.messages[i].applicationId,sessionId:notification.messages[i].sessionId,contextId:notification.messages[i].contextId,subscriptionId:notification.messages[i].subscriptionId,url:notification.messages[i].url||notification.options.url}}));return Promise.all(promises)})})})})}).catch(function(error){console.error("Unable to get subscription data",error);var title="An error occurred",message="We were unable to get the information for this push message",notificationTag="notification-error";return self.registration.showNotification(title,{body:message,tag:notificationTag})}))}),self.addEventListener("notificationclick",function(event){console.log("SW: Notification click",event.notification.tag),event.notification.close();var url=event.notification.data&&event.notification.data.url||"./";event.waitUntil(clients.matchAll({type:"window"}).then(function(clientList){for(var i=0;i<clientList.length;i++){var client=clientList[i];if(client.url===url&&"focus"in client)return client.focus()}if(clients.openWindow)return clients.openWindow(url)}).then(function(){fetch(requestUrl,{method:"post",body:JSON.stringify({qualifier:"pt.openapi.context/createContextRequest",data:{properties:null}})}).then(function(response){console.log("SW created context."),response.json().then(function(data){sessionId=response.headers.get("SessionId"),contextId=data.data.contextId,fetch(requestUrl+"?SessionId="+event.notification.data.sessionId,{method:"post",body:JSON.stringify({qualifier:"pt.openapi.push/notificationOpened/1.0",contextId:event.notification.data.contextId,data:{hwid:event.notification.data.subscriptionId,applicationId:event.notification.data.applicationId,notificationId:event.notification.data.notificationId}})}).then(function(response){console.log("SW notify server that push notification has been open.")}).catch(function(error){console.error("Error while trying notify server about open push notification.")})})})}))});