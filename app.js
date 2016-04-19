let tinput = document.querySelector('#input');
let cbutton = document.querySelector('#convert-btn');
let pbutton = document.querySelector('#copy-btn');
let tbutton = document.querySelector('#tweet-btn');

let decodeEntities = function(s) {
	let div = document.createElement('div');
	return s.replace(/(&[\w\d#]+;)/g, function(m) {
		div.innerHTML = m;
		return div.textContent;
	});
};

let parseHTML = function(content, newlines) {
	content = content.replace(/<div ([\w\s=\-"']+)>/g, '\n').replace(/<\/div>/g, '')
		.replace(/<br([\w\s=\-"'\/]*)>/g, '\n').replace(/<([\w\s=\-"']+)>/g, '').replace(/<\/([\w\s=\-"']+)>/g, '');
	content = decodeEntities(content);
	return content;
};

let editing = true;
let doUpdate = true;
let inputContent = '';
let allowed = ['div', 'br', 'span'];
let updateInput = function(e, convert) {
	if (!editing || (e && !doUpdate)) return;
	let range = rangy.getSelection().saveCharacterRanges(tinput);
	// remove HTML tags (if there)
	let els = tinput.querySelectorAll('*');
	for (let i in els) {
		let el = els[i];
		if (!(el instanceof Node)) continue;
		if (allowed.includes(el.tagName.toLowerCase())) continue;
		// check if div should be inserted (i.e. newline)
		let cs = getComputedStyle(el);
		let n = 'div';
		if (cs.display != 'block') {
			n = '';
		}
		let pre = n ? ('<' + n + '>') : '';
		let aft = n ? ('</' + n + '>') : '';
		el.outerHTML = pre + el.innerHTML + aft;
	}
	if (tinput.innerHTML == '<br>') tinput.innerHTML = '';
	inputContent = ('innerText' in tinput) ? tinput.innerText : parseHTML(tinput.innerHTML);

	let tokens = parseTweet(inputContent);
	let items = [];
	for (let token of tokens) {
		let span = document.createElement('span');
		span.classList.add('token');
		span.textContent = token.content;
		if (token.type == 'special') {
			span.classList.add('special');
		} else if (token.type == 'match') {
			span.classList.add('match');
			span.setAttribute('original', token.content);
			span.setAttribute('selected', token.content);
			span.setAttribute('substitutes', JSON.stringify(token.substitutes));
			if (convert) {
				span.textContent = token.substitutes[0];
				span.setAttribute('selected', token.substitutes[0]);
			}
		}
		items.push(span);
	}
	input.innerHTML = '';
	for (let i of items) {
		input.appendChild(i);
	}

	rangy.getSelection().restoreCharacterRanges(tinput, range);
};

input.addEventListener('keydown', updateInput);
input.addEventListener('keyup', updateInput);
input.addEventListener('click', updateInput);
document.addEventListener('DOMContentLoaded', () => {
	input.focus();
});

document.querySelector('#inst-btn').addEventListener('click', function() {
	this.classList.add('disabled');
	if (doUpdate == true) {
		doUpdate = false;
		let brect = this.getBoundingClientRect();
		this.textContent = 'Desktop Mode';
		let arect = this.getBoundingClientRect();
		Velocity.hook(this, 'width', `${brect.width}px`);
		Velocity(this, {
			width: arect.width
		}, 300, 'easeOutExpo', () => {
			this.style.width = '';
			this.classList.remove('disabled');
		});
		try { localStorage.twitminjs_mobilemode = true; } catch(e) {}
	} else {
		doUpdate = true;
		let brect = this.getBoundingClientRect();
		this.textContent = 'Mobile Mode';
		let arect = this.getBoundingClientRect();
		Velocity.hook(this, 'width', `${brect.width}px`);
		Velocity(this, {
			width: arect.width
		}, 300, 'easeOutExpo', () => {
			this.style.width = '';
			this.classList.remove('disabled');
		});
		try { delete localStorage.twitminjs_mobilemode; } catch(e) {}
	}
});
if (localStorage.twitminjs_mobilemode) {
	document.querySelector('#inst-btn').textContent = 'Desktop Mode';
	doUpdate = false;
}

let updateCharDisplay = function() {
	let iBox = document.querySelector('#input-box');
	if (editing)
		iBox.removeAttribute('bftext');
	else
		iBox.setAttribute('bftext', `${inputContent.length}/140`);
};

let tokenOnClick = function() {
	if (editing) return;
	let token = this;
	let tbox = this.getBoundingClientRect();
	let options = JSON.parse(this.getAttribute('substitutes'));
	options.push(this.getAttribute('original'));
	let selected = this.getAttribute('selected');

	let menu = document.createElement('div');
	let soffset;
	menu.className = 'substitution-menu';
	document.body.appendChild(menu); // must append here for offsetLeft/Top to work
	for (let i of options) {
		let option = document.createElement('div');
		option.className = 'option';
		option.setAttribute('content', i);
		menu.appendChild(option); // see above comment

		let textPos = document.createElement('span');
		textPos.textContent = '-';
		option.appendChild(textPos);
		if (i == selected) {
			option.classList.add('selected');
			soffset = [textPos.offsetLeft, textPos.offsetTop];
		}
		option.setAttribute('offsetX', textPos.offsetLeft);
		option.setAttribute('offsetY', textPos.offsetTop);
		option.removeChild(textPos);
		option.textContent = i;

		option.addEventListener('click', function() {
			menu.classList.add('disabled');
			menu.querySelector('.selected').classList.remove('selected');
			this.classList.add('selected');
			tbox = token.getBoundingClientRect();
			token.textContent = this.getAttribute('content');
			let qbox = token.getBoundingClientRect();
			token.setAttribute('selected', this.getAttribute('content'));
			if (qbox.height == tbox.height) {
				token.style.display = 'inline-block';
				token.style.whiteSpace = 'nowrap';
				Velocity.hook(token, 'width', `${tbox.width}px`);
				Velocity(token, {
					width: qbox.width
				}, 300, 'easeOutExpo', function() {
					token.style.width = '';
					token.style.height = '';
					token.style.display = '';
					token.style.whiteSpace = '';
				});
			}
			inputContent = ('innerText' in tinput) ? tinput.innerText : parseHTML(tinput.innerHTML);
			updateCharDisplay();

			// close menu
			Velocity.hook(menu, 'transformOriginX', `${this.getAttribute('offsetX')}px`);
			Velocity.hook(menu, 'transformOriginY', `${this.getAttribute('offsetY')}px`);
			Velocity(menu, {
				scaleX: 0,
				scaleY: 0,
				translateX: tbox.left - this.getAttribute('offsetX'),
				translateY: tbox.top - this.getAttribute('offsetY'),
				opacity: 0
			}, 300, 'easeInQuint', function() {
				document.body.removeChild(menu);
			});
		});
	}
	if (!soffset) {
		let textPos = document.createElement('span');
		let option = menu.querySelector('.option');
		let text = option.textContent;
		option.innerHTML = '';
		option.appendChild(textPos);
		soffset = [textPos.offsetLeft, textPos.offsetTop];
		option.removeChild(textPos);
		option.textContent = text;
	}
	// position box so that the selected text overlaps with the token
	Velocity.hook(menu, 'translateX', `${tbox.left - soffset[0]}px`);
	Velocity.hook(menu, 'translateY', `${tbox.top - soffset[1]}px`);
	let box = menu.getBoundingClientRect();
	if (box.left < 10)
		Velocity.hook(menu, 'translateX', '10px');
	if (box.top < 10)
		Velocity.hook(menu, 'translateY', '10px');
	if (box.right > innerWidth - 10)
		Velocity.hook(menu, 'translateX', `${innerWidth - box.width - 10}px`);
	if (box.bottom > innerHeight - 10)
		Velocity.hook(menu, 'translateY', `${innerHeight - box.height - 10}px`);
	Velocity.hook(menu, 'transformOriginX', `${soffset[1]}px`);
	Velocity.hook(menu, 'transformOriginY', `${soffset[1]}px`);
	Velocity.hook(menu, 'scaleX', 0);
	Velocity.hook(menu, 'scaleY', 0);
	Velocity(menu, {
		scaleX: 1,
		scaleY: 1
	}, 300, 'easeOutExpo');
};

Velocity.hook(pbutton, 'scaleX',  0);
Velocity.hook(pbutton, 'scaleY',  0);
Velocity.hook(pbutton, 'opacity', 0);
Velocity.hook(tbutton, 'scaleX',  0);
Velocity.hook(tbutton, 'scaleY',  0);
Velocity.hook(tbutton, 'opacity', 0);

cbutton.addEventListener('click', function() {
	this.classList.add('disabled');
	if (editing) {
		input.setAttribute('contenteditable', 'false');
		input.classList.add('frozen');
		updateInput(null, true);
		editing = false;

		let tokens = document.querySelectorAll('.token.match');
		for (let i in tokens) {
			let token = tokens[i];
			if (!(token instanceof Node)) continue;
			token.addEventListener('click', tokenOnClick);
		}

		Velocity(input, 'stop');
		Velocity.hook(input, 'backgroundColorRed', 0x13);
		Velocity.hook(input, 'backgroundColorGreen', 0x58);
		Velocity.hook(input, 'backgroundColorBlue', 0xb0);
		Velocity.hook(input, 'backgroundColorAlpha', '1');
		requestAnimationFrame(() => {
			Velocity(input, {
				backgroundColor: '#1e2c40',
				backgroundColorAlpha: 1
			}, 300, 'ease-out');
		});
		// animate button size
		let brect = cbutton.getBoundingClientRect();
		cbutton.textContent = 'Done';
		let arect = cbutton.getBoundingClientRect();
		Velocity.hook(cbutton, 'width', `${brect.width}px`);
		Velocity(cbutton, {
			width: arect.width
		}, 300, 'easeOutExpo', function() {
			cbutton.style.width = '';
			cbutton.classList.remove('disabled');
		});
		Velocity(pbutton, {
			scaleX: 1,
			scaleY: 1,
			opacity: 1
		}, 300, 'easeOutExpo');
		Velocity(tbutton, {
			scaleX: 1,
			scaleY: 1,
			opacity: 1
		}, 300, 'easeOutExpo');

		updateCharDisplay();
	} else {
		editing = true;
		input.classList.remove('frozen');
		Velocity(input, 'stop');
		Velocity(input, {
			backgroundColor: '#1358b0',
			backgroundColorAlpha: 1
		}, 300, 'ease-out', function() {
			input.style.backgroundColor = '';
			input.setAttribute('contenteditable', 'true');
			input.focus();
			updateInput();
		});

		// animate button size
		let brect = cbutton.getBoundingClientRect();
		cbutton.textContent = 'Convert';
		let arect = cbutton.getBoundingClientRect();
		Velocity.hook(cbutton, 'width', `${brect.width}px`);
		Velocity(cbutton, {
			width: arect.width
		}, 300, 'easeOutExpo', function() {
			cbutton.style.width = '';
			cbutton.classList.remove('disabled');
		});
		Velocity(pbutton, {
			scaleX: 0,
			scaleY: 0,
			opacity: 0
		}, 300, 'easeOutExpo');
		Velocity(tbutton, {
			scaleX: 0,
			scaleY: 0,
			opacity: 0
		}, 300, 'easeOutExpo');

		updateCharDisplay();
	}
});

let copyToClipboard = function(string) {
	// create hidden text element, if it doesn't already exist
	var targetId = "_hiddenCopyText_";
	var origSelectionStart, origSelectionEnd;

	// must use a temporary form element for the selection and copy
	target = document.getElementById(targetId);
	if (!target) {
		var target = document.createElement("textarea");
		target.style.position = "absolute";
		target.style.left = "-9999px";
		target.style.top = "0";
		target.id = targetId;
		document.body.appendChild(target);
	}
	target.textContent = string;

	// select the content
	var currentFocus = document.activeElement;
	target.focus();
	target.setSelectionRange(0, target.value.length);

	// copy the selection
	var succeed;
	try {
		succeed = document.execCommand("copy");
	} catch(e) {
		succeed = false;
	}
	// restore original focus
	if (currentFocus && typeof currentFocus.focus === "function") {
		currentFocus.focus();
	}

	// clear temporary content
	target.textContent = "";

	return succeed;
}
pbutton.addEventListener('click', function() {
	if (editing) return;
	copyToClipboard(('innerText' in tinput) ? tinput.innerText : parseHTML(tinput.innerHTML));
});
tbutton.addEventListener('click', function() {
	if (editing) return;
	let t = ('innerText' in tinput) ? tinput.innerText : parseHTML(tinput.innerHTML);
	window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(t), '_blank');
});