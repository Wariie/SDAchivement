import deckyPlugin from "@decky/rollup";
// import css from 'rollup-plugin-css-only';
import copy from 'rollup-plugin-copy2';

export default deckyPlugin({
    // css: true,
     plugins: [
        // copy({
        //     assets: [
        //         ["defaults/assets/style.css", "style.css"],
        //     ]
        // }),
    ]
});
