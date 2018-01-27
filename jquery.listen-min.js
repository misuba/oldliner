/**
 * jQuery.Listen - Dynamic event handling.
 * Copyright (c) 2007 Ariel Flesler - aflesler(at)gmail(dot)com
 * Licensed under LGPL license (http://www.gnu.org/licenses/lgpl.html).
 * Date: 30/09/2007
 * @author Ariel Flesler
 * @version 0.5
 * @projectDescription Clean, dynamic, event handling, using event delegation.
 * Compatible with jQuery 1.2, tested on Firefox 2.0.0.6, and IE 6, both on Windows.
 **/
(function($){function Indexer(a,b){this.event=a;this.listener=b;this.ids={};this.names={};this.start()};$.extend(Indexer,{count:0,handler:function(e){Indexer.prototype.parse.apply(Indexer.instances[e.type+this.id],arguments)},instances:{}});Indexer.prototype={start:function(){$.event.add(this.listener,this.event,Indexer.handler)},parse:function(d){var e=d.target,handlers=[];if(e.id&&this.ids[e.id])push(handlers,this.ids[e.id]);each([e.nodeName,'*'],function(b){var c;if(c=this.names[b]){each(push(e.className.split(' '),['*']),function(a){if(c[a])push(handlers,c[a])})}},this);if(handlers.length){each(handlers,function(a){a.apply(e,this)},arguments)}e=handlers=d=null},append:function(a,b){var c=new Index(a);if(c.id){(this.ids[c.id]||(this.ids[c.id]=[])).push(b)}else if(c.nodeName){var d=this.names[c.nodeName]||(this.names[c.nodeName]={});(d[c.className]||(d[c.className]=[])).push(b)}else{throw'jQuery.listen > "'+a+'" was not recognized as a valid selector.';}}};function Index(a){var b=Index.regex.exec(a)||[];if(b[1]){this.id=b[1]}else if(b[2]||b[3]){this.nodeName=b[2]?b[2].toUpperCase():'*';this.className=b[3]?b[3].substring(1):'*'}};Index.regex=/#([\w\d_-]+)$|(\w*)(\.[\w_]+)?$/;$.listen=function(a,b,c,d){if(!$.listen.ignore&&g[b])throw'jQuery.Listen > "'+b+'" doesn\'t bubble';d=d&&d!=document?d:document.documentElement;var e=d.id||(d.id='jqi_guid'+Indexer.count++);var f=Indexer.instances[b+e]||(Indexer.instances[b+e]=new Indexer(b,d));f.append(a,c)};$.fn.listen=function(a,b,c){return this.each(function(){$.listen(a,b,c,this)})};function each(a,b,c){for(var i=0,l=a.length;i<l;i++)b.call(c,a[i],i)};function push(a,b){Array.prototype.push.apply(a,b);return a};var g={blur:1,focus:1,change:1};$.event.add(window,'unload',function(){if(window.Indexer)Indexer.instances=null})})(jQuery);