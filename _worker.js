var upstream=''
// Custom pathname for the upstream website.
const upstream_path = '/'

// Website you intended to retrieve for users using mobile devices.
const upstream_mobile = upstream

// Countries and regions where you wish to suspend your service.
const blocked_region = []

// IP addresses which you wish to block from using your service.
const blocked_ip_address = ['0.0.0.0', '127.0.0.1']

// Whether to use HTTPS protocol for upstream address.
const https = true

// Whether to disable cache.
const disable_cache = false

// Replace texts.
const replace_dict = {
    '$upstream': '$custom_domain',
}

const changeCookie=(headers,domain)=>{
    // 检查是否存在 Set-Cookie 头
  if (headers.has('Set-Cookie')) {
    // 获取原始 Set-Cookie 头
    const setCookieHeaders = headers.getAll('Set-Cookie');

    // 修改 Set-Cookie 的 Domain 属性
    const modifiedSetCookieHeaders = setCookieHeaders.map(cookie => {
      if (cookie.includes('Domain=')) {
        // 替换原有的 Domain 属性
        return cookie.replace(/Domain=[^;]+/, `Domain=${domain}`);
      } else {
        // 如果没有 Domain 属性，添加一个
        return `${cookie}; Domain=${domain}`;
      }
    });
    // 移除原始的 Set-Cookie 头
    headers.delete('Set-Cookie');

    // 添加修改后的 Set-Cookie 头
    modifiedSetCookieHeaders.forEach(modifiedCookie => {
      headers.append('Set-Cookie', modifiedCookie);
    });

 }
}

// Main fetch event listener
export default {
  async fetch(request, env, ctx) {
    return await fetchAndApply(request,env);
  }
}

async function fetchAndApply(request,env) {
    const region = env.IP_COUNTRY
    const ip_address = env.CONNECTING_IP
    const user_agent = env.USER_AGENT
    const client_cookie=env.COOKIE
    const client_data=env.CLIENT_DATA
    upstream=env.URL

    let response = null;
    let url = new URL(request.url);
    let url_hostname = url.hostname;

    // Adjust protocol based on the `https` flag
    url.protocol = https ? 'https:' : 'http:';

    // Check device type
    const isDesktop = await device_status(user_agent);
    const upstream_domain = isDesktop ? upstream : upstream_mobile;

    // Update URL for upstream
    url.host = upstream_domain;
    url.pathname = url.pathname === '/' ? upstream_path : upstream_path + url.pathname;

    // Block by region or IP
    if (blocked_region.includes(region)) {
        return new Response('Access denied: WorkersProxy is not available in your region yet.', {
            status: 403
        });
    } else if (blocked_ip_address.includes(ip_address)) {
        return new Response('Access denied: Your IP address is blocked by WorkersProxy.', {
            status: 403
        });
    } else {
        // Forward the request to the upstream server
        let method = request.method;
        let request_headers = new Headers(request.headers);
        
        // Modify headers for upstream request
        request_headers.set('Host', upstream_domain);
        request_headers.set('Referer', url.protocol + '//' + upstream);
        request_headers.set('x-client-data',client_data);
        request_headers.set('authority',upstream);
        changeCookie(request_headers,upstream_domain)
        
        let original_response = await fetch(url.href, {
            method: method,
            headers: request_headers,
            body: request.body
        });

        let connection_upgrade = request_headers.get("Upgrade");
        if (connection_upgrade && connection_upgrade.toLowerCase() === "websocket") {
            return original_response;
        }

        // Modify the response
        let original_response_clone = original_response.clone();
        let new_response_headers = new Headers(original_response.headers);
        let status = original_response.status;

        if (disable_cache) {
            new_response_headers.set('Cache-Control', 'no-store');
        }

        // Add CORS headers
        new_response_headers.set('access-control-allow-origin', '*');
        new_response_headers.set('access-control-allow-credentials', 'true');
        new_response_headers.delete('content-security-policy');
        new_response_headers.delete('content-security-policy-report-only');
        new_response_headers.delete('clear-site-data');
        
        if (new_response_headers.get("x-pjax-url")) {
            new_response_headers.set("x-pjax-url", new_response_headers.get("x-pjax-url").replace("//" + upstream_domain, "//" + url_hostname));
        }

        // Handle text/html content-type replacements
        const content_type = new_response_headers.get('content-type');
        let response_body;
        if (content_type && content_type.includes('text/html') && content_type.includes('UTF-8')) {
            response_body = await replace_response_text(original_response_clone, upstream_domain, url_hostname);
        } else {
            response_body = original_response_clone.body;
        }
        changeCookie(new_response_headers,'$custom_domain')
        return new Response(response_body, {
            status,
            headers: new_response_headers
        });
    }
}

// Replace text in the response based on the replace_dict rules
async function replace_response_text(response, upstream_domain, host_name) {
    let text = await response.text();

    for (let i in replace_dict) {
        let j = replace_dict[i];
        if (i === '$upstream') {
            i = upstream_domain;
        } else if (i === '$custom_domain') {
            i = host_name;
        }

        if (j === '$upstream') {
            j = upstream_domain;
        } else if (j === '$custom_domain') {
            j = host_name;
        }

        let re = new RegExp(i, 'g');
        text = text.replace(re, j);
    }
    return text;
}

// Check if the request is from a desktop or mobile device
async function device_status(user_agent_info) {
    const agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
    for (let agent of agents) {
        if (user_agent_info.indexOf(agent) > 0) {
            return false;  // Mobile
        }
    }
    return true;  // Desktop
}
