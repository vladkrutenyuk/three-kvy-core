import Feature, { FeatureProps } from '../Feature'

export default class AudioGof extends Feature<{}> {
	static readonly DefaultVolume = 0.2
	private static readonly _allAudioElemnts = new Set<HTMLAudioElement>()
	private static _muted = true
	public static get muted() {
		return this._muted
	}
	public static set muted(value: boolean) {
		if (this._muted === value) return
		this._muted = value
		this._allAudioElemnts.forEach((x) => (x.muted = value))
	}

	readonly type = AudioGof.name

	readonly src: string
	readonly name: string

	private _looped: boolean
	private _volume: number

	constructor(
		props: FeatureProps<
			{},
			Readonly<{ mediaSrc: string; looped?: boolean; volume?: number }>
		>
	) {
		super(props)
		this.src = props.mediaSrc
		this.name = this.src.split('/').pop() ?? ''
		this._looped = props.looped ?? false
		this._volume = props.volume ?? AudioGof.DefaultVolume
	}
}
