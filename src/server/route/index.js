const router = {
    handle: function (io, socket, receiveData, cb) {
        if (!(cb instanceof Function)) {
            cb = console.log;
        }
        const now = new Date();
        const path = `${receiveData.method} ${receiveData.path}`;
        const end = (status, data) => {
            cb({ status, data });
            console.log(`-----> ${path} ${status} ${Date.now() - now.getTime()}ms`);
        };

        console.log(`<----- ${path}`);
        if (this[path]) {
            this[path].call(
                {
                    io,
                    socket,
                    end,
                },
                receiveData.data
            ).catch(e => {
                if (/^assert failed./.test(e.message)) {
                    console.info(e.message);
                    return;
                }
                console.error(e);
                console.log(`-----> ${path} 500 ${Date.now() - now.getTime()}ms`);
                return end(500, e.message);
            });
        }
        else {
            console.log(`-----> ${path} 404 ${Date.now() - now.getTime()}ms`);
            end(404, 'interface not exits');
        }
    },
};

module.exports = router;
