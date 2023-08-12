<script lang="ts">
    import { enhance } from '$app/forms';
    import { onMount } from 'svelte';

    onMount(() => {
        const es = new EventSource('/sse');

        es.addEventListener('message', (e) => {
            console.log(e.data);
        });

        return () => {
            es.close();
        };
    });
</script>

<form method="post" enctype="multipart/form-data" use:enhance>
    <div>
        <label for="name">Name</label>
        <input type="text" name="name" id="name" />
    </div>

    <div>
        <label for="file">File</label>
        <input type="file" name="file" id="file" />
    </div>

    <button type="submit">Submit</button>
</form>

<style>
    :global(html) {
        color-scheme: dark light;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
            Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
            sans-serif;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1em;
        max-width: 65ch;
    }
    div {
        display: flex;
        flex-direction: column;
        gap: 1em;
    }

    input,
    button {
        padding: 0.5em 1em;
    }
    button {
        cursor: pointer;
    }
</style>
