// Website you intended to retrieve for users.
const upstream = 'www.google.com'

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
export function onRequest(context) {
  return new Response("Hello, world!")
}
async function fetchAndApply(request) {
    const region = request.headers.get('cf-ipcountry').toUpperCase();
    const ip_address = request.headers.get('cf-connecting-ip');
    const user_agent = request.headers.get('user-agent');

    let response = null;
    let url = new URL(request.url);
    let url_hostname = url.hostname;

    if (https == true) {
        url.protocol = 'https:';
    } else {
        url.protocol = 'http:';
    }

    if (await device_status(user_agent)) {
        var upstream_domain = upstream;
    } else {
        var upstream_domain = upstream_mobile;
    }

    url.host = upstream_domain;
    if (url.pathname == '/') {
        url.pathname = upstream_path;
    } else {
        url.pathname = upstream_path + url.pathname;
    }

    if (blocked_region.includes(region)) {
        response = new Response('Access denied: WorkersProxy is not available in your region yet.', {
            status: 403
        });
    } else if (blocked_ip_address.includes(ip_address)) {
        response = new Response('Access denied: Your IP address is blocked by WorkersProxy.', {
            status: 403
        });
    } else {
        let method = request.method;
        let request_headers = request.headers;
        let new_request_headers = new Headers(request_headers);

        new_request_headers.set('Host', upstream_domain);
        new_request_headers.set('Referer', url.protocol + '//' + upstream);
        new_request_headers.set('Cookie','SID=g.a000nggpEhDtT9g6ql5PiFW3WiEdBmVhxgw4TuN2By4X5Q74htkwOCEmkTwl_XqrnSX58BaQkgACgYKAT4SARESFQHGX2MiQJ3bSY36qckO_8Cr_vS21xoVAUF8yKoqcw395EWywVobSsfFNO950076; __Secure-1PSID=g.a000nggpEhDtT9g6ql5PiFW3WiEdBmVhxgw4TuN2By4X5Q74htkwHIUEQD38B70cfvr8hv1lgAACgYKAbwSARESFQHGX2MisSgUQrKz_2g5C2HDHOZQiRoVAUF8yKqbfZYhNQNdi6opLNYzGESG0076; __Secure-3PSID=g.a000nggpEhDtT9g6ql5PiFW3WiEdBmVhxgw4TuN2By4X5Q74htkwG5Ve__AGe8RGSFE5jnC88wACgYKAQcSARESFQHGX2Mii1m0Tn8TfdWPXvlgOw8rPhoVAUF8yKo5MKAd_gfoPykwDLFJRBfa0076; HSID=AAxRA3lsPOT8_vj2b; SSID=AcMDadB_EzXx67Whw; APISID=n9L36RgLtk3BZGv3/A6cP2uOiVNDX-fW2y; SAPISID=vv1ZFVTh5s7-ZL6G/AiHosnbrb2oaKz5pw; __Secure-1PAPISID=vv1ZFVTh5s7-ZL6G/AiHosnbrb2oaKz5pw; __Secure-3PAPISID=vv1ZFVTh5s7-ZL6G/AiHosnbrb2oaKz5pw; OTZ=7714394_24_24__24_; AEC=AVYB7cq4zbG5bCvXzla9e141uB2Z9hvwjkFxF93xes1FXsmcEhPb1BrpTw; __Secure-1PSIDTS=sidts-CjEBQlrA-NpgnK265FaiUVnQ2hT4nt6zmb4nYA3mA9Adg--Wy5O8oCoMkZdJz2hgAzrHEAA; __Secure-3PSIDTS=sidts-CjEBQlrA-NpgnK265FaiUVnQ2hT4nt6zmb4nYA3mA9Adg--Wy5O8oCoMkZdJz2hgAzrHEAA; NID=517=jVoO7xtaIeRvJn3VIGVHouD8oNu63rFDSv56vmuNBvr1G5An647sKhXZJP3STEe61uAnnFdzfglGEkxdxW58JXsCN5uNxwmpzmfqO6MAKXzFVaR-VhXI5C48foq2rFH6y9-KdIJ6hlgmKKwM0JdpdyrPqVnnUlaO7unCG4ZfpJ0hLllA2rZ2_FY7WYm6v4lDNR4W1EGfC_vSnQWD43ItcjhiBqybctycq5JIP7NeWgjEypFFEKZC-IuvKolYuXA1OC7m8eaBOl-A1AYulwcSTIxVO2L6vWH4TaF5nI_DKmiib3S8SZc_2hhB2pLxQUKozAiAuuaTLcZl3vLLHocThVtFTtI1FRkOKE5Hxene7qkNkhw1hoH8NWb4VhUidtNE9AMD0RVAtpVJDpUfuaCRMUQXqqAcVKNtljFsewDHtQwuAwYY6xxldnuSR7Eii8mV_rpsKDognQTd8sauG10JCC8E4iorKonrGrSlt8tAT85nT8MhlHkE37C8jS3bfAhdwfoy47zBBYXxOowjKbZUElDUaeNrljPYhf14Lddy0b3PcKnm3_fI0ExYvzZC6OK3quENc1IJfif21iM66cPOm5meMb0rgGCPbX2hOi5tZlBQZKRI2cTYzUBBHtTHOJysjnxqa5iSkanEX0jXAk8yvEX4jAwX9qSOhB2Tq5f9yUwhdt31tWjW3F-bggyIyYJrTiQVQnZd0063ZHZL1mMjC5ubMxze-J4FrzCteF6ouY3eRvaalgNNoB_tWMYE1hMPYYOlCe-ZoWuzBOKc4d7j3yleoBqH9NZjV6Agv6DKdMMh0i0Q4Q; SIDCC=AKEyXzUiuWeQd-DQwPAU0oni0-eK-MBuLrlLcLaYhlCx-RqqiwJk4pF03mV7agIOLR2Vosgt0qQ; __Secure-1PSIDCC=AKEyXzXY7FNqTma-SGpAYPhPK-lMmLfpuCeZCHmhV95uJ6Jl-H1yLYr-X2GHwA-xM2Xw5PyvtQM; __Secure-3PSIDCC=AKEyXzXjeO7h6Cfdpd69M8TbR3ZXKIAG_yfEHa7qeQmdS9HX0n7c6H-Gj0NFvhmo4LxJ8ZywfXs')
        new_request_headers.set('X-Client-Data','CIe2yQEIorbJAQipncoBCNiQywEIlqHLAQiGoM0BCLnIzQEIr57OAQjlr84BCL25zgEI173OAQjTvs4BGI/OzQEYm7HOARiavM4B')

        let original_response = await fetch(url.href, {
            method: method,
            headers: new_request_headers,
            body: request.body
        })

        connection_upgrade = new_request_headers.get("Upgrade");
        if (connection_upgrade && connection_upgrade.toLowerCase() == "websocket") {
            return original_response;
        }

        let original_response_clone = original_response.clone();
        let original_text = null;
        let response_headers = original_response.headers;
        let new_response_headers = new Headers(response_headers);
        let status = original_response.status;
		
		if (disable_cache) {
			new_response_headers.set('Cache-Control', 'no-store');
	    }

        new_response_headers.set('access-control-allow-origin', '*');
        new_response_headers.set('access-control-allow-credentials', true);
        new_response_headers.delete('content-security-policy');
        new_response_headers.delete('content-security-policy-report-only');
        new_response_headers.delete('clear-site-data');
		
		if (new_response_headers.get("x-pjax-url")) {
            new_response_headers.set("x-pjax-url", response_headers.get("x-pjax-url").replace("//" + upstream_domain, "//" + url_hostname));
        }
		
        const content_type = new_response_headers.get('content-type');
        if (content_type != null && content_type.includes('text/html') && content_type.includes('UTF-8')) {
            original_text = await replace_response_text(original_response_clone, upstream_domain, url_hostname);
        } else {
            original_text = original_response_clone.body
        }
		
        response = new Response(original_text, {
            status,
            headers: new_response_headers
        })
    }
    return response;
}

async function replace_response_text(response, upstream_domain, host_name) {
    let text = await response.text()

    var i, j;
    for (i in replace_dict) {
        j = replace_dict[i]
        if (i == '$upstream') {
            i = upstream_domain
        } else if (i == '$custom_domain') {
            i = host_name
        }

        if (j == '$upstream') {
            j = upstream_domain
        } else if (j == '$custom_domain') {
            j = host_name
        }

        let re = new RegExp(i, 'g')
        text = text.replace(re, j);
    }
    return text;
}


async function device_status(user_agent_info) {
    var agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
    var flag = true;
    for (var v = 0; v < agents.length; v++) {
        if (user_agent_info.indexOf(agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}
