export function disposeCallback<TDisposable extends { dispose: () => void }>(
	disposable: TDisposable
) {
	disposable.dispose();
}
