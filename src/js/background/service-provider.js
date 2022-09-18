'use strict';

import GoogleConfig from '../services/google/config';
import LingueeConfig from '../services/linguee/config';
import LLConfig from '../services/ll/config';
import MultitranConfig from '../services/multitran/config';
import TFDConfig from '../services/tfd/config';
import FCConfig from '../services/fc/config';
import CVConfig from '../services/cv/config';

import GoogleProvider from '../services/google/provider';
import LingueeProvider from '../services/linguee/provider';
import LLProvider from '../services/ll/provider';
import MultitranProvider from '../services/multitran/provider';
import TFDProvider from '../services/tfd/provider';
import FCProvider from '../services/fc/provider';
import CVProvider from '../services/cv/provider';

import CvService from '../services/cv/service';

export default class ServiceProvider{
	get ll(){
		return this._ll||(this._ll = new LLProvider(LLConfig));
	}

	get google(){
		return this._google||(this._google = new GoogleProvider(GoogleConfig));
	}

	get linguee(){
		return this._linguee || (this._linguee = new LingueeProvider(LingueeConfig));
	}

	get tfd(){
		return this._tfd || (this._tfd = new TFDProvider(TFDConfig));
	}

	get multitran(){
		return this._multitran ||(this._multitran = new MultitranProvider(MultitranConfig));
	}

	get fc(){
		return this._fc ||(this._fc = new FCProvider(FCConfig));
	}

	get dictionaryServices(){
		return [this.ll, this.google, this.tfd, this.linguee, this.multitran, this.fc];
	}

	// get cv(){
	// 	return this._cv ||(this._cv = new CvService(new CVProvider(CVConfig), this.dictionaryServices));
	// }

	get all(){
		return this.dictionaryServices //.concat([this.cv]);
	}
}