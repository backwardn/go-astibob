package worker

import (
	"encoding/base64"
	"encoding/json"
	"net/http"

	"sort"

	"github.com/asticode/go-astibob"
	"github.com/asticode/go-astilog"
	astiworker "github.com/asticode/go-astitools/worker"
	"github.com/gorilla/websocket"
	"github.com/pkg/errors"
)

// Register registers the worker to the index
func (w *Worker) RegisterToIndex() {
	// Create headers
	h := make(http.Header)
	if w.o.Index.Password != "" && w.o.Index.Username != "" {
		h.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(w.o.Index.Username+":"+w.o.Index.Password)))
	}

	// Dial
	w.w.Dial(astiworker.DialOptions{
		Addr:   "ws://" + w.o.Index.Addr + "/websockets/worker",
		Client: w.ws,
		Header: h,
		OnDial: w.sendRegister,
		OnReadError: func(err error) {
			if v, ok := errors.Cause(err).(*websocket.CloseError); ok && v.Code == websocket.CloseNormalClosure {
				astilog.Info("worker: worker has disconnected from index")
			} else {
				astilog.Error(errors.Wrap(err, "worker: reading websocket failed"))
			}
		},
	})
}

func (w *Worker) sendRegister() (err error) {
	// Get runnable keys
	w.mr.Lock()
	var ks []string
	for k := range w.rs {
		ks = append(ks, k)
	}

	// Sort
	sort.Strings(ks)

	// Loop through runnables
	var as []astibob.Ability
	for _, k := range ks {
		// Get runnable
		r := w.rs[k]

		// Append ability
		as = append(as, astibob.Ability{
			Metadata: r.Metadata(),
			Status:   r.Status(),
		})
	}
	w.mr.Unlock()

	// Create message
	var m *astibob.Message
	if m, err = astibob.NewCmdWorkerRegisterMessage(w.from(), &astibob.Identifier{
		Type: astibob.IndexIdentifierType,
	}, as); err != nil {
		err = errors.Wrap(err, "worker: creating message failed")
		return
	}

	// Dispatch
	w.d.Dispatch(m)
	return
}

func (w *Worker) finishRegistration(m *astibob.Message) (err error) {
	// Parse payload
	if err = astibob.ParseEventWorkerWelcomePayload(m); err != nil {
		err = errors.Wrap(err, "worker: parsing message payload failed")
		return
	}

	// Log
	astilog.Info("worker: worker has registered to the index")
	return
}

func (w *Worker) handleIndexMessage(p []byte) (err error) {
	// Log
	astilog.Debugf("worker: handling index message %s", p)

	// Unmarshal
	m := astibob.NewMessage()
	if err = json.Unmarshal(p, m); err != nil {
		err = errors.Wrap(err, "worker: unmarshaling failed")
		return
	}

	// Dispatch
	w.d.Dispatch(m)
	return
}

func (w *Worker) sendMessageToIndex(m *astibob.Message) (err error) {
	// Log
	astilog.Debugf("worker: sending %s message to index", m.Name)

	// Write
	if err = w.ws.WriteJSON(m); err != nil {
		err = errors.Wrap(err, "worker: writing JSON message failed")
		return
	}
	return
}