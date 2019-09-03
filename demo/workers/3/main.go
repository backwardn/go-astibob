package main

import (
	"flag"

	"github.com/asticode/go-astibob"
	"github.com/asticode/go-astibob/abilities/audio_input"
	"github.com/asticode/go-astibob/worker"
	"github.com/asticode/go-astilog"
)

func main() {
	// Parse flags
	flag.Parse()
	astilog.FlagInit()

	// Create worker
	w := worker.New("Worker #3", worker.Options{
		Index: astibob.ServerOptions{
			Addr:     "127.0.0.1:4000",
			Password: "admin",
			Username: "admin",
		},
		Server: astibob.ServerOptions{Addr: "127.0.0.1:4003"},
	})
	defer w.Close()

	// Register listenables
	w.RegisterListenables(worker.Listenable{
		Listenable: audio_input.NewListenable(audio_input.ListenableOptions{
			OnSamples: func(samples []int32, significantBits int, sampleRate, silenceMaxAudioLevel float64) (err error) {
				astilog.Warnf("samples: %+v - sample rate: %v - significant bits: %v - silence max audio level: %v", len(samples), sampleRate, significantBits, silenceMaxAudioLevel)
				return
			},
		}),
		Runnable: "Audio input",
		Worker:   "Worker #2",
	})

	// Handle signals
	w.HandleSignals()

	// Serve
	w.Serve()

	// Register to index
	w.RegisterToIndex()

	// Blocking pattern
	w.Wait()
}
