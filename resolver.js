class Token {
	constructor(str = '') {
		this.str = str;
		this.type = undefined;
	}
	toString() {
		return this.str;
	}
}
class WordToken extends Token {
	constructor(str) {
		super(str);
		this.type = 'word';
		this.options = [str];
	}
}
class FillerToken extends Token {
	constructor(str) {
		super(str);
		this.type = 'fill';
	}
}
class SpecialToken extends Token {
	constructor(str, kind = null) {
		super(str);
		this.type = 'special';
		this.kind = kind;
	}
	get length() {
		return this.kind != 'url' ? this.str.length : 23;
	}
}
var Resolver;
{
	let alternatives = substData;
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
	Resolver = class Resolver {
		process(tweet, opts = []) {
			opts.noegg     = !!opts.noegg     || false;
			opts.ligatures = !!opts.ligatures || true;
			opts.phrases   = !!opts.phrases   || true;

			// tweet = tweet.trim();
			tweet.replace(/\r\n/g, '\n');
			let orig = tweet;
			tweet = tweet.replace(/.../g, '\u2026');
			tweet = tweet.replace(/->/g,  '\u2192');
			tweet = tweet.replace(/<-/g,  '\u2190');

			if (!opts.noegg) {
				// safeguards
				// blame @mvilcis for the linux part, apparently
				tweet = tweet.replace(/(\b(?:gnu\/|arch|)linux|unix|\*nix|posix|macos|mac os|os x)(\s+)(is\s+(?:really\s+)?(?:bad|awful|terrible)|sucks(?:\s+dick|\s+balls|))\b/img, m => {
					let opsys = m[1];
					let space = m[2];
					let iswha = m[3];
					if (opsys.toLowerCase() == 'linux') {
						opsys = (opsys == 'LINUX') ? 'GNU/LINUX' : 'GNU/Linux';
					}
					let isgr8 = (iswha == iswha.toUpperCase()) ? 'IS GREAT' : 'is great';
					return opsys + space + isgr8;
				});
			}
			for (let c of tweet) {
				for (let i = 0; i < 3; i++) {
					if (processChar(c)) break;
				}
			}
			if (this.wordbuf.length) {
				switch(this.coll) {
					case 'email':
					case 'hash':
					case 'url':
					case 'handle':
						this.addToken(new SpecialToken(this.wordbuf), this.coll);
						break;
					case 'junk':
						this.addToken(new FillerToken(this.wordbuf));
						break;
					case null:
						this.addToken(new WordToken(this.wordbuf));
						break;
				}
			}
			if (opts.phrases) this.combinePhrases();
			this.findAlternatives();
			if (opts.ligatures) this.applyLigatures();
			this.makeShort();
			this.totalLength = this.orig.length - this.linkLenAdjust.length;
		}
		applyLigaturesDo(word) {
			for (let i in ligatures) {
				word = word.replace(new RegExp(`${i}`, 'g'), ligatures[i])
			}
		}
		applyLigatures() {
			for (let token of this.tokens) {
				if (token instanceof WordToken) {
					for (let i in token.options) {
						let opt = token.options[i];
						token.options[i] = applyLigaturesDo(opt);
					}
					if (!token.options.includes(token.str)) {
						token.options.push(token.str);
					}
				}
			}
		}
		combinePhrases() {
			
		}
	}
}