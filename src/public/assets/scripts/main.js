(()=>{"use strict";var e,t={140:()=>{var e=biigle.$require("messages").handleErrorResponse;var t=function(e,t,n,r,o,i,s,a){var u,l="function"==typeof e?e.options:e;if(t&&(l.render=t,l.staticRenderFns=n,l._compiled=!0),r&&(l.functional=!0),i&&(l._scopeId="data-v-"+i),s?(u=function(e){(e=e||this.$vnode&&this.$vnode.ssrContext||this.parent&&this.parent.$vnode&&this.parent.$vnode.ssrContext)||"undefined"==typeof __VUE_SSR_CONTEXT__||(e=__VUE_SSR_CONTEXT__),o&&o.call(this,e),e&&e._registeredComponents&&e._registeredComponents.add(s)},l._ssrRegister=u):o&&(u=a?function(){o.call(this,(l.functional?this.parent:this).$root.$options.shadowRoot)}:o),u)if(l.functional){l._injectStyles=u;var d=l.render;l.render=function(e,t){return u.call(t),d(e,t)}}else{var f=l.beforeCreate;l.beforeCreate=f?[].concat(f,u):[u]}return{exports:e,options:l}}({data:function(){return{quote:""}},methods:{refreshQuote:function(){this.$http.get("quotes/new").then(this.handleResponse,e)},handleResponse:function(e){this.quote=e.body}},created:function(){this.refreshQuote()}},undefined,undefined,!1,null,null,null);const n=t.exports;biigle.$mount("quotes-container",n)},401:()=>{}},n={};function r(e){var o=n[e];if(void 0!==o)return o.exports;var i=n[e]={exports:{}};return t[e](i,i.exports,r),i.exports}r.m=t,e=[],r.O=(t,n,o,i)=>{if(!n){var s=1/0;for(d=0;d<e.length;d++){for(var[n,o,i]=e[d],a=!0,u=0;u<n.length;u++)(!1&i||s>=i)&&Object.keys(r.O).every((e=>r.O[e](n[u])))?n.splice(u--,1):(a=!1,i<s&&(s=i));if(a){e.splice(d--,1);var l=o();void 0!==l&&(t=l)}}return t}i=i||0;for(var d=e.length;d>0&&e[d-1][2]>i;d--)e[d]=e[d-1];e[d]=[n,o,i]},r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),(()=>{var e={355:0,392:0};r.O.j=t=>0===e[t];var t=(t,n)=>{var o,i,[s,a,u]=n,l=0;if(s.some((t=>0!==e[t]))){for(o in a)r.o(a,o)&&(r.m[o]=a[o]);if(u)var d=u(r)}for(t&&t(n);l<s.length;l++)i=s[l],r.o(e,i)&&e[i]&&e[i][0](),e[i]=0;return r.O(d)},n=self.webpackChunkbiigle_module=self.webpackChunkbiigle_module||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))})(),r.O(void 0,[392],(()=>r(140)));var o=r.O(void 0,[392],(()=>r(401)));o=r.O(o)})();