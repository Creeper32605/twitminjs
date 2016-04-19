String.prototype.atIndex = function(i) {
		return i < 0 ? '' : (i >= this.length ? '' : this[i]);
};

// sort substitution data by size, so that larger ones are matched first
{
	let sortable = [];
	for (let k in substData)
		sortable.push([k, substData[k]]);
	sortable.sort(function(a, b) {
		return b[0].length - a[0].length;
	});
	substData = {};
	for (let i of sortable) {
		substData[i[0]] = i[1];
	}
}

let ligatures = {
	'AA': 'Ꜳ',
	'aa': 'ꜳ',
	'AE': 'Æ',
	'ae': 'æ',
	'AO': 'Ꜵ',
	'ao': 'ꜵ',
	'AU': 'Ꜷ',
	'au': 'ꜷ',
	'AV': 'Ꜹ',
	'av': 'ꜹ',
	'AY': 'Ꜽ',
	'ay': 'ꜽ',
	'DZ': 'Ǳ',
	'Dz': 'ǲ',
	'dz': 'ǳ',
	'DŽ': 'Ǆ',
	'Dž': 'ǅ',
	'dž': 'ǆ',
	'ffi': 'ﬃ',
	'ffl': 'ﬄ',
	'ff': 'ﬀ',
	'fi': 'ﬁ',
	'fl': 'ﬂ',
	'IJ': 'Ĳ',
	'ij': 'ĳ',
	'LJ': 'Ǉ',
	'Lj': 'ǈ',
	'lj': 'ǉ',
	'NJ': 'Ǌ',
	'Nj': 'ǋ',
	'nj': 'ǌ',
	'OE': 'Œ',
	'OO': 'Ꝏ',
	'oo': 'ꝏ',
	'ft': 'ﬅ',
	'ue': 'ᵫ'
};

var parseTweet = function(tweet, ligatures, noegg) {
	if (!noegg) {
		// safeguards
		// blame @mvilcis for the linux part, apparently
		tweet = tweet.replace(/(\b(?:gnu\/|arch|)linux|unix|\*nix|posix|macos|mac os|os x)(\s+)(is\s+(?:really\s+)?(?:bad|awful|terrible)|sucks(?:\s+dick|\s+balls|))\b/img,
			(m, opsys, space, iswha)  => {
			if (opsys.toLowerCase() == 'linux') {
				opsys = (opsys == 'LINUX') ? 'GNU/LINUX' : 'GNU/Linux';
			}
			let isgr8 = (iswha == iswha.toUpperCase()) ? 'IS GREAT' : 'is great';
			return opsys + space + isgr8;
		});
	}

	let lastToken = '';
	let tokens = [];
	let i = -1; // index
	for (let c of tweet) {
		i++;
		// skip special nodes
		if ((['@', '$', '#'].includes(lastToken.substr(0,1)) ||
			lastToken.substr(0,7) == 'http://' || lastToken.substr(0,8) == 'https://')) {
			if (!c.match(/[\s\n]/)) {
				lastToken += c;
				continue;
			} else {
				tokens.push({
					content: lastToken,
					type: 'special'
				});
				lastToken = '';
			}
		}
		lastToken += c;
		if (c.match(/[\s\n]/)) {
			if (['@', '$', '#'].includes(tweet.atIndex(i + 1)) ||
				tweet.substr(i + 1, 7) == 'http://' || tweet.substr(i + 1, 8) == 'https://') {
				tokens.push({
					content: lastToken,
					type: 'none'
				});
				lastToken = '';
				continue;
			}
		}
		let lLastToken = lastToken.toLowerCase();
		for (let k in substData) {
			let v = substData[k];
			if (lLastToken.includes(k)) {
				let pos = lLastToken.indexOf(k);
				let pre = lastToken.substr(0, pos);
				let str = lastToken.substr(pos, k.length);
				let pst = lastToken.substr(pos + k.length);
				let ps2 = pst || tweet.atIndex(i + 1);
				if ((pre && !pre.substr(pre.length - 1).match(/\W/)) ||
					(ps2 && !pst.substr(0, 1).match(/\W/))) continue;
				if (!str) continue;
				if (pre.length) {
					tokens.push({
						content: pre,
						type: 'none'
					});
				}
				tokens.push({
					content: str,
					type: 'match',
					substitutes: (typeof v == 'string') ? [v] : v
				});
				if (pst.length) {
					lastToken = pst;
				} else {
					lastToken = '';
				}
			}
		}
	}
	if (lastToken.length) {
		tokens.push({
			content: lastToken,
			type: 'none'
		});
	}
	if (ligatures) {
		for (let token of tokens) {
			if (token.type == 'none') {
				for (let i in ligatures) {
					token.content = token.content.replace(new RegExp(i, 'g'), ligatures[i]);
				}
			}
		}
	}
	return tokens;
};