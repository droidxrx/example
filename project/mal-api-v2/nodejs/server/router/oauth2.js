const { Router } = require("express");
const { Oauth2 } = require("mal-api-v2");
const { readFile, writeFileSync } = require("jsonfile");

/**
 * @param {Object} obj
 * @param {string} obj.clientId
 * @param {string} [obj.clientSecret] Optional
 * @param {string} [obj.urlRedirect] Optional
 * @param {string} obj.dataBase
 */
function oauth2(obj) {
	const { clientId, clientSecret, urlRedirect, dataBase } = obj;
	const oauth2 = new Oauth2(clientId, clientSecret);
	const router = Router();
	const dataError = (res, error, message) => res.status(400).json({ status: false, return: { error, message } });
	//prettier-ignore
	const getOrRefreshToken = (obj, getOrRefresh = false) => {
		const dataSendWrite = (resp) => {
			writeFileSync(dataBase, Object.assign(obj.data, { token: resp.return }));
			obj.res.json(resp);
		};
		if (getOrRefresh) oauth2.getToken(obj.code, obj.codeChallenge).then(dataSendWrite).catch((err) => obj.res.status(400).json(err));
		else oauth2.refreshToken(obj.refreshToken).then(dataSendWrite).catch((err) => obj.res.status(400).json(err));
	}

	router.get("/", (req, res) => {
		const { code } = req.query;
		if (code) {
			readFile(dataBase, (err, data) => {
				if (err) return dataError(res, "database", `Cant read file: ${dataBase}`);
				const codeChallenge = data.pkce.code_challenge;
				if (codeChallenge) getOrRefreshToken({ code, codeChallenge, dataBase, data, res }, true);
				else dataError(res, "code_challenge", "Cant find code_challenge from database");
			});
		} else dataError(res, "Parameter code", "Parameter code not found or empty.");
	});

	router.get("/refresh-token", (req, res) => {
		readFile(dataBase, (err, data) => {
			if (err) return dataError(res, "database", `Cant read file: ${dataBase}`);
			const refreshToken = data.token.refresh_token;
			if (refreshToken) getOrRefreshToken({ refreshToken, data, res });
			else dataError(res, "refresh_token", "Cant find refresh_token from database");
		});
	});

	router.get("/authorize", (req, res) => {
		const pkce = oauth2.pkceGenerate();
		// Save pkce to database
		writeFileSync(dataBase, { pkce });
		res.redirect(oauth2.urlAuthorize(pkce.code_challenge, urlRedirect));
	});

	return router;
}

module.exports = oauth2;
